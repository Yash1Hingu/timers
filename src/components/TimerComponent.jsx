import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db/firebase';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
} from "firebase/firestore";

const TimerComponent = () => {

    const [timers, setTimers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [playingAudio, setPlayingAudio] = useState(false); // Add state for audio playing
    const audioRef = useRef(new Audio('/oversimplified-alarm-clock-113180.mp3'));
    const timersCollectionRef = collection(db, "timers");

    const addTimer = async () => {
        const newTimer = {
            hours: 0,
            minutes: 0,
            seconds: 0,
            title: `Timer${Date.now()}`,
            running: false,
            finished: false,
            intervalId: null,
        };

        try {
            setLoading(true);
            await addDoc(timersCollectionRef, newTimer);
            setLoading(false);
        } catch (error) {
            console.error('Error adding timer:', error);
        }

        setTimers([
            ...timers,
            newTimer
        ]);
    };

    const removeTimer = async (id) => {
        const userDoc = doc(db, "timers", id);
        setLoading(true);
        await deleteDoc(userDoc);
        setLoading(false);
        setTimers(timers.filter(timer => timer.id !== id));
    };

    const handleTimerChange = async (index, field, value) => {
        let limitedValue = value;
        if (field === 'hours' && value > 23) limitedValue = 23;
        if ((field === 'minutes' || field === 'seconds') && value > 59) limitedValue = 59;

        const updatedTimers = [...timers];
        updatedTimers[index][field] = limitedValue;

        const timerId = updatedTimers[index].id;
        const userDoc = doc(db, "timers", timerId);
        const newFields = { [field]: value };
        await updateDoc(userDoc, newFields);
        setTimers(updatedTimers);
    };

    const handleStart = (index) => {
        const updatedTimers = [...timers];
        updatedTimers[index].running = true;

        const intervalId = setInterval(() => {
            setTimers(prevTimers => {
                const updated = [...prevTimers];
                let { hours, minutes, seconds } = updated[index];

                if (seconds > 0) {
                    seconds--;
                } else if (minutes > 0) {
                    minutes--;
                    seconds = 59;
                } else if (hours > 0) {
                    hours--;
                    minutes = 59;
                    seconds = 59;
                } else {
                    clearInterval(updated[index].intervalId);
                    updated[index].running = false;
                    updated[index].finished = true;
                    handleTimerEnd(index);
                }

                updated[index] = { ...updated[index], hours, minutes, seconds };
                return updated;
            });
        }, 1000);

        updatedTimers[index].intervalId = intervalId;
        setTimers(updatedTimers);
    };

    const handleReset = (index) => {
        const updatedTimers = [...timers];
        updatedTimers[index].running = false;
        updatedTimers[index].hours = 0;
        updatedTimers[index].minutes = 0;
        updatedTimers[index].seconds = 0;
        updatedTimers[index].finished = false;
        clearInterval(updatedTimers[index].intervalId);
        setTimers(updatedTimers);
        setPlayingAudio(false); // Reset audio playing state
    };

    const handleTimerEnd = (index) => {
        if (Notification.permission === 'granted') {
            new Notification('Timer Ended', {
                body: `The timer "${timers[index].title}" has ended!`,
            });
        }

        audioRef.current.play();
        setPlayingAudio(true); // Set audio playing state
    };

    const handleStopRing = () => {

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setPlayingAudio(false); // Stop the audio and reset playingAudio state
    };

    useEffect(() => {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        const timersCollection = collection(db, 'timers');
        const unsubscribe = onSnapshot(timersCollection, snapshot => {
            const timersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTimers(timersData);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="container mx-auto p-4">
            <button
                onClick={addTimer}
                className={`bg-black p-4 rounded-full mb-4 ${loading ? 'bg-gray-700' : ''}`}
                disabled={loading}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><g fill="none"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" /><path fill="white" d="M10.5 20a1.5 1.5 0 0 0 3 0v-6.5H20a1.5 1.5 0 0 0 0-3h-6.5V4a1.5 1.5 0 0 0-3 0v6.5H4a1.5 1.5 0 0 0 0 3h6.5z" /></g></svg>
            </button>

            <div className='flex gap-12 flex-wrap'>
                {timers.map((timer, index) => (
                    <div key={index} className="p-4 mb-4 rounded shadow-lg bg-white bg-opacity-70 w-[300px] fadein">
                        <input
                            type="text"
                            placeholder="Timer Title"
                            className="outline-none border-b-2 w-full mb-4 p-4 bg-transparent text-black font-bold text-xl border-gray-700"
                            value={timer.title}
                            onChange={(e) => handleTimerChange(index, 'title', e.target.value)}
                        />
                        <div className="flex mb-2 justify-center relative items-center font-bold">
                            <input
                                type="number"
                                className="border-none outline-none text-center text-2xl w-full bg-transparent"
                                placeholder="HH"
                                value={timer.hours}
                                onChange={(e) => handleTimerChange(index, 'hours', e.target.value)}
                                max="23"
                                disabled={timer.running || timer.finished}
                            />
                            <span
                                className='text-4xl'
                            >:</span>
                            <input
                                type="number"
                                className="border-none outline-none text-center text-2xl py-6 w-full bg-transparent"
                                placeholder="MM"
                                value={timer.minutes}
                                onChange={(e) => handleTimerChange(index, 'minutes', e.target.value)}
                                max="59"
                                disabled={timer.running || timer.finished}
                            />
                            <span
                                className='text-4xl'
                            >:</span>
                            <input
                                type="number"
                                className="border-none outline-none text-center text-2xl py-6 w-full bg-transparent"
                                placeholder="SS"
                                value={timer.seconds}
                                onChange={(e) => handleTimerChange(index, 'seconds', e.target.value)}
                                max="59"
                                disabled={timer.running || timer.finished}
                            />
                        </div>

                        <div className="flex space-x-2 relative">
                            <button
                                onClick={() => handleStart(index)}
                                className={`bg-black hover:bg-gray-700 text-white font-bold p-4 rounded-full ${timer.running && 'opacity-50 cursor-not-allowed'} absolute -bottom-9 -right-9`}
                                disabled={timer.running || timer.finished}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="2.2em" height="2.2em" viewBox="0 0 24 24"><path fill="white" d="M8 5.14v14l11-7z" /></svg>
                            </button>
                            <button
                                onClick={() => handleReset(index)}
                                className="bg-black hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 21 21"><g fill="none" fill-rule="evenodd" stroke="white" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 3.5c2.414 1.377 4 4.022 4 7a8 8 0 1 1-8-8" /><path d="M14.5 7.5v-4h4" /></g></svg>
                            </button>
                            {playingAudio && (
                                <button
                                    onClick={handleStopRing}
                                    className="bg-black hover:bg-gray-700 text-white font-bold p-4 rounded-full absolute -bottom-9 -right-9"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="2.2em" height="2.2em" viewBox="0 0 24 24"><path fill="white" d="M6 18V6h12v12z" /></svg>
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => removeTimer(timer.id)}
                            className='bg-black hover:bg-gray-700 text-white font-bold p-2 rounded-full absolute -top-6 -right-6'
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="2.2em" height="2.2em" viewBox="0 0 36 36"><path fill="white" d="m19.61 18l4.86-4.86a1 1 0 0 0-1.41-1.41l-4.86 4.81l-4.89-4.89a1 1 0 0 0-1.41 1.41L16.78 18L12 22.72a1 1 0 1 0 1.41 1.41l4.77-4.77l4.74 4.74a1 1 0 0 0 1.41-1.41Z" class="clr-i-outline clr-i-outline-path-1" /><path fill="white" d="M18 34a16 16 0 1 1 16-16a16 16 0 0 1-16 16m0-30a14 14 0 1 0 14 14A14 14 0 0 0 18 4" class="clr-i-outline clr-i-outline-path-2" /><path fill="none" d="M0 0h36v36H0z" /></svg>
                        </button>
                    </div>
                ))}
            </div>


        </div>
    );
};

export default TimerComponent;
