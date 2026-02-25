const API_BASE = "http://localhost:8000/api";

export const loginWithGoogle = () => {
    window.location.href = `${API_BASE}/auth/google/login`;
};

export const getMessages = async () => {
    try {
        const res = await fetch(`${API_BASE}/messages`);
        if (!res.ok) throw new Error("Failed to fetch messages");
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
};

export const syncMessages = async (email) => {
    try {
        const res = await fetch(`${API_BASE}/messages/sync?email=${encodeURIComponent(email)}`, {
            method: 'POST'
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || "Failed to sync");
        }
        return await res.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
};
