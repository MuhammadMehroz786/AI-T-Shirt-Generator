import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Configuration, OpenAIApi } from "openai";
import "./App.css";
import tshirtMockup from "./tshirt-mockup.webp";

function App() {
  const [prompt, setPrompt] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false); // Added state to toggle between login and signup

  const apiKey = "KEY"; // Replace with your actual OpenAI API key
  const configuration = new Configuration({ apiKey });
  const openai = new OpenAIApi(configuration);

  const enhancePrompt = async (inputPrompt) => {
    try {
      const response = await openai.createCompletion({
        model: "gpt-4",
        prompt: `Enhance the following prompt for DALL-E with White Background and dark themed: "${inputPrompt}"`,
        max_tokens: 50,
      });
      return response.data.choices[0].text.trim();
    } catch (error) {
      console.error("Error enhancing prompt:", error);
      return inputPrompt;
    }
  };

  const generateImage = async () => {
    if (credits > 0) {
      setLoading(true);
      try {
        const enhanced = await enhancePrompt(prompt);
        setEnhancedPrompt(enhanced);

        const response = await openai.createImage({
          prompt: enhanced,
          n: 1,
          size: "512x512",
        });
        setResult(response.data.data[0].url);
        setCredits(credits - 1);

        // Update credits in Firestore
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { credits: credits - 1 }, { merge: true });
      } catch (error) {
        console.error("Error generating image:", error);
        setResult("Error generating image. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      alert("You have no credits left. Please try again later.");
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;
      setUser(loggedInUser);

      // Fetch user credits from Firestore
      const userRef = doc(db, "users", loggedInUser.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        setCredits(docSnap.data().credits || 0);
      } else {
        // Initialize user with 10 credits if not found
        await setDoc(userRef, { credits: 10 });
        setCredits(10);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert(`Login failed: ${error.message}`);
    }
  };

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      setUser(newUser);

      // Initialize user with 10 credits
      const userRef = doc(db, "users", newUser.uid);
      await setDoc(userRef, { credits: 10 });
      setCredits(10);
    } catch (error) {
      console.error("Error signing up:", error);
      alert(`Signup failed: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCredits(0);
    } catch (error) {
      console.error("Error logging out:", error);
      alert(`Logout failed: ${error.message}`);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Fetch user credits from Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setCredits(docSnap.data().credits || 0);
        } else {
          // Initialize user with 10 credits if not found
          await setDoc(userRef, { credits: 10 });
          setCredits(10);
        }
      } else {
        setUser(null);
        setCredits(0);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="app-main">
      {user ? (
        <>
          <div className="header">
            <div className="counter">Remaining Credits: {credits}</div>
            <button onClick={handleLogout}>Logout</button>
          </div>
          {loading ? (
            <>
              <h2>Generating.. Please Wait..</h2>
              <div className="lds-ripple">
                <div></div>
                <div></div>
              </div>
            </>
          ) : (
            <>
              <h2>Generate an Image using OpenAI API</h2>
              <textarea
                className="app-input"
                placeholder="Enter your prompt..."
                onChange={(e) => setPrompt(e.target.value)}
                rows="10"
                cols="40"
                disabled={credits === 0}
              />
              <button onClick={generateImage} disabled={credits === 0}>
                Generate an Image
              </button>
              {result && (
                <>
                  <div className="tshirt-container">
                    <img className="tshirt-mockup" src={tshirtMockup} alt="T-Shirt Mockup" />
                    <img className="result-image-on-tshirt" src={result} alt="Generated result on T-shirt" />
                  </div>
                  <p>Enhanced Prompt: {enhancedPrompt}</p>
                </>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <h2>{isSignup ? "Signup" : "Login"}</h2>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={isSignup ? handleSignup : handleLogin}>
            {isSignup ? "Signup" : "Login"}
          </button>
          <button onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Switch to Login" : "Switch to Signup"}
          </button>
        </>
      )}
    </div>
  );
}

export default App;
