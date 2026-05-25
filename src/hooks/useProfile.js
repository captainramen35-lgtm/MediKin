import { useState, useEffect, useCallback } from "react";
import { getProfile, getUserProfiles } from "../utils/firestore";

export const useProfile = (profileId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getProfile(profileId);
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { profile, loading, error, refetch: fetch };
};

export const useUserProfiles = (uid) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getUserProfiles(uid);
      setProfiles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { profiles, loading, error, refetch: fetch };
};
