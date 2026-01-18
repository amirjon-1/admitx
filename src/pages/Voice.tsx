import { useStore } from "../store/useStore";

export function Voice() {
  const { user } = useStore();

  const handleConnect = () => {
    // Pass user_id to the voice agent so it saves with the correct ID
    const url = new URL("https://interviewer.admitx.tech/");
    if (user?.id) {
      url.searchParams.set("user_id", user.id);
    }
    window.location.href = url.toString();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Voice Interview</h1>
      <p className="text-gray-600 mb-6">
        Click connect to open the live interview experience.
      </p>

      <button
        className="rounded-lg bg-blue-600 text-white px-4 py-2"
        onClick={handleConnect}
      >
        Connect
      </button>
    </div>
  );
}
