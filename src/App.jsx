import React, { useReducer, useEffect, useCallback } from "react";
import SelectField from "./components/select/page";
import listOfGenreOption from "./store/genre.json";
import listOfMoodOption from "./store/mood.json";
import './components/styles/styles.css'


const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const initialState = {
  genre: "",
  mood: "",
  level: "",
  aiResponses: [],
  isLoading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_GENRE":
      return { ...state, genre: action.payload, mood: "" };

    case "SET_MOOD":
      return { ...state, mood: action.payload };

    case "SET_LEVEL":
      return { ...state, level: action.payload };

    case "FETCH_START":
      return { ...state, isLoading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        aiResponses: [...state.aiResponses, action.payload],
      };

    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const availableMoodBasedOnGenre = listOfMoodOption[state.genre] || [];

  const fetchRecommendations = useCallback(async () => {
    if (!state.genre || !state.mood || !state.level) return;

    dispatch({ type: "FETCH_START" });

    try {
      const prompt = `You are a professional librarian. 
        Recommend 6 REAL books for a ${state.level} ${state.genre} reader feeling ${state.mood}.
        Format each as: Title by Author (Year) - Explain why.
        If you aren't 100% sure about a book's existence, do not include it.
        `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );

      const data = await response.json();

      const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No recommendation returned.";

      dispatch({ type: "FETCH_SUCCESS", payload: answer });
    } catch (err) {
      dispatch({ type: "FETCH_ERROR", payload: err.message });
    }
  }, [state.genre, state.mood, state.level]);

  useEffect(() => {
    dispatch({ type: "SET_MOOD", payload: "" });
  }, [state.genre]);

  return (
    <section className="app">
      <SelectField
        placeholder="Please select a genre"
        id="genre"
        options={listOfGenreOption}
        onSelect={(val) => dispatch({ type: "SET_GENRE", payload: val })}
        value={state.genre}
      />

      <SelectField
        placeholder="Please select a mood"
        id="mood"
        options={availableMoodBasedOnGenre}
        onSelect={(val) => dispatch({ type: "SET_MOOD", payload: val })}
        value={state.mood}
      />

      <SelectField
        placeholder="Please select a level"
        id="level"
        options={["Beginner", "Intermediate", "Expert"]}
        onSelect={(val) => dispatch({ type: "SET_LEVEL", payload: val })}
        value={state.level}
      />

      <button onClick={fetchRecommendations}>
        {state.isLoading ? "Getting recommendations..." : "Get Recommendation"}
      </button>

      {state.error && <p style={{ color: "red" }}>{state.error}</p>}

      <br />
      <br />

      {state.aiResponses.map((recommend, index) => (
        <details key={index} name="recommendation">
          <summary>Recommendation {index + 1}</summary>
          <p>{recommend}</p>
        </details>
      ))}
    </section>
  );
}
