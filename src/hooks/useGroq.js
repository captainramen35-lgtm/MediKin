import { useState } from "react";
import { callGroq } from "../utils/groq";

export const useGroq = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = async (messages, systemPrompt) => {
    setLoading(true);
    setError(null);
    try {
      const response = await callGroq(messages, systemPrompt);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { send, loading, error };
};
