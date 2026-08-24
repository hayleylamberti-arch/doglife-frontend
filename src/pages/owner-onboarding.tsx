import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Suburb = {
  id: string;
  suburbName: string;
  city: string;
  province: string;
};

export default function OwnerOnboarding() {
  const navigate = useNavigate();
  const { user, refreshMe } = useAuth();

  const [suburbs, setSuburbs] = useState<Suburb[]>([]);
  const [selectedSuburbId, setSelectedSuburbId] = useState(
    user?.suburbId || ""
  );

  const [dogName, setDogName] = useState("");

  const [loadingSuburbs, setLoadingSuburbs] = useState(true);
  const [savingSuburb, setSavingSuburb] = useState(false);
  const [savingDog, setSavingDog] = useState(false);

  const [error, setError] = useState("");
  const [showMissingSuburbHelp, setShowMissingSuburbHelp] =
    useState(false);

  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (user?.onboardingCompleted && !completed) {
      navigate("/owner/dashboard", { replace: true });
    }
  }, [user?.onboardingCompleted, completed, navigate]);

  useEffect(() => {
    let active = true;

    async function loadSuburbs() {
      try {
        setLoadingSuburbs(true);
        setError("");

        const response = await api.get("/api/suburbs");

        const items = Array.isArray(response.data?.suburbs)
          ? response.data.suburbs
          : [];

        if (active) {
          setSuburbs(items);
        }
      } catch {
        if (active) {
          setError(
            "We couldn't load DogLife suburbs right now. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoadingSuburbs(false);
        }
      }
    }

    loadSuburbs();

    return () => {
      active = false;
    };
  }, []);

  const selectedSuburb = useMemo(
    () =>
      suburbs.find(
        (suburb) => suburb.id === selectedSuburbId
      ),
    [suburbs, selectedSuburbId]
  );

  const suburbSaved =
    Boolean(user?.suburbId) &&
    (user?.onboardingStep ?? 0) >= 2;

  async function saveSuburb() {
    if (!selectedSuburbId) {
      setError("Please choose your suburb first.");
      return;
    }

    try {
      setSavingSuburb(true);
      setError("");

      await api.patch("/api/owner/onboarding", {
        suburbId: selectedSuburbId,
        onboardingStep: 2,
      });

      await refreshMe();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          "We couldn't save your suburb. Please try again."
      );
    } finally {
      setSavingSuburb(false);
    }
  }

  async function saveDog() {
    const name = dogName.trim();

    if (!name) {
      setError("Please enter your dog's name.");
      return;
    }

    try {
      setSavingDog(true);
      setError("");

      await api.post("/api/owner/dogs", {
        name,
      });

      await api.patch("/api/owner/onboarding", {
        onboardingStep: 3,
        onboardingCompleted: true,
      });

      setCompleted(true);
      await refreshMe();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          "We couldn't add your dog. Please try again."
      );
    } finally {
      setSavingDog(false);
    }
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">🎉</div>

            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              You’re all set
            </h1>

            <p className="mt-3 text-gray-600">
              {dogName.trim()
                ? `${dogName.trim()} is added and you’re ready to find trusted dog care near you.`
                : "You’re ready to find trusted dog care near you."}
            </p>

            <Button
              type="button"
              onClick={() => navigate("/owner/search")}
              className="mt-6 w-full"
            >
              Find services
            </Button>

            <button
              type="button"
              onClick={() => navigate("/owner/my-dogs")}
              className="mt-4 text-sm font-medium text-blue-700 underline"
            >
              Complete Dog Passport later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">🐾</div>

          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to DogLife
          </h1>

          <p className="mt-3 text-gray-600">
            Let’s get you ready to find trusted dog care near you.
          </p>
        </div>

        <div className="mb-5 flex items-center gap-3 text-sm">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold ${
              suburbSaved
                ? "bg-green-100 text-green-700"
                : "bg-blue-600 text-white"
            }`}
          >
            {suburbSaved ? "✓" : "1"}
          </div>

          <div className="flex-1">
            <div className="font-semibold text-gray-900">
              Your suburb
            </div>

            <div className="text-gray-500">
              So we can show services near you
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {!suburbSaved ? (
            <>
              <h2 className="text-xl font-bold text-gray-900">
                Where are you?
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                DogLife uses your suburb to show services currently
                available near you.
              </p>

              <label
                htmlFor="owner-suburb"
                className="mt-6 block text-sm font-medium text-gray-700"
              >
                Suburb
              </label>

              <select
                id="owner-suburb"
                value={selectedSuburbId}
                onChange={(event) => {
                  setSelectedSuburbId(event.target.value);
                  setError("");
                }}
                disabled={
                  loadingSuburbs || savingSuburb
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-3"
              >
                <option value="">
                  {loadingSuburbs
                    ? "Loading suburbs..."
                    : "Select your suburb"}
                </option>

                {suburbs.map((suburb) => (
                  <option
                    key={suburb.id}
                    value={suburb.id}
                  >
                    {suburb.suburbName}
                    {suburb.city &&
                    suburb.city !== suburb.suburbName
                      ? `, ${suburb.city}`
                      : ""}
                  </option>
                ))}
              </select>

              {selectedSuburb ? (
                <p className="mt-2 text-xs text-gray-500">
                  {selectedSuburb.city} ·{" "}
                  {selectedSuburb.province}
                </p>
              ) : null}

              {error ? (
                <p className="mt-3 text-sm text-red-600">
                  {error}
                </p>
              ) : null}

              <Button
                type="button"
                onClick={saveSuburb}
                disabled={
                  !selectedSuburbId ||
                  loadingSuburbs ||
                  savingSuburb
                }
                className="mt-6 w-full"
              >
                {savingSuburb
                  ? "Saving..."
                  : "Continue"}
              </Button>

              <button
                type="button"
                onClick={() =>
                  setShowMissingSuburbHelp(
                    (current) => !current
                  )
                }
                className="mt-4 w-full text-center text-sm font-medium text-blue-700 underline"
              >
                I can’t find my suburb
              </button>

              {showMissingSuburbHelp ? (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  <strong>
                    DogLife is growing suburb by suburb.
                  </strong>

                  <p className="mt-1">
                    If your suburb isn’t listed yet, that
                    simply means we haven’t launched there
                    yet. We’ll add a quick suburb request
                    here next so we can let you know when
                    DogLife reaches your area.
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div>
              <div className="text-sm font-medium text-green-700">
                ✓ Suburb saved
              </div>

              <h2 className="mt-2 text-xl font-bold text-gray-900">
                Great — now let’s add your dog
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                You’ll only need their name to get started.
                You can build their Dog Passport with health,
                behaviour and care details anytime.
              </p>
            </div>
          )}
        </div>

        <div className="mb-5 flex items-center gap-3 text-sm">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold ${
              suburbSaved
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            2
          </div>

          <div className="flex-1">
            <div
              className={
                suburbSaved
                  ? "font-semibold text-gray-900"
                  : "font-semibold text-gray-400"
              }
            >
              Add your dog
            </div>

            <div className="text-gray-500">
              Just the basics for now
            </div>
          </div>
        </div>

        {suburbSaved ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              What’s your dog’s name?
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              That’s all you need to get started. You can
              add the rest of their Dog Passport later.
            </p>

            <label
              htmlFor="dog-name"
              className="mt-6 block text-sm font-medium text-gray-700"
            >
              Dog name
            </label>

            <Input
              id="dog-name"
              value={dogName}
              onChange={(event) => {
                setDogName(event.target.value);
                setError("");
              }}
              placeholder="e.g. Moose"
              autoComplete="off"
              className="mt-2"
            />

            {error ? (
              <p className="mt-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <Button
              type="button"
              onClick={saveDog}
              disabled={
                !dogName.trim() || savingDog
              }
              className="mt-6 w-full"
            >
              {savingDog
                ? "Adding..."
                : "Add my dog"}
            </Button>

            <p className="mt-4 text-center text-xs text-gray-500">
              Health, vaccination, behaviour and vet
              information can all be added later.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
