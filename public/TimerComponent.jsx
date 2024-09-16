import React, { useState, useEffect, useRef } from 'react';

const TimerComponent = () => {
    const [timers, setTimers] = useState([]);
    const [playingAudio, setPlayingAudio] = useState(null); // State to store the currently playing audio
    const intervalRefs = useRef([]); // To keep track of intervals for each timer

    const addTimer = () => {
        setTimers([
            ...timers,
            { hours: 0, minutes: 0, seconds: 0, title: '', running: false, finished: false }
        ]);
    };

    const handleTimerChange = (index, field, value) => {
        const updatedTimers = [...timers];
        updatedTimers[index][field] = value;
        setTimers(updatedTimers);
    };

    const handleStart = (index) => {
        const updatedTimers = [...timers];
        updatedTimers[index].running = true;
        updatedTimers[index].finished = false;
        setTimers(updatedTimers);

        // Start countdown
        intervalRefs.current[index] = setInterval(() => {
            decrementTime(index);
        }, 1000);
    };

    const decrementTime = (index) => {
        const updatedTimers = [...timers];
        let { hours, minutes, seconds } = updatedTimers[index];

        if (hours === 0 && minutes === 0 && seconds === 0) {
            clearInterval(intervalRefs.current[index]);
            updatedTimers[index].running = false;
            updatedTimers[index].finished = true;
            handleTimerEnd(index);
        } else {
            if (seconds > 0) {
                seconds -= 1;
            } else if (minutes > 0) {
                minutes -= 1;
                seconds = 59;
            } else if (hours > 0) {
                hours -= 1;
                minutes = 59;
                seconds = 59;
            }
        }

        updatedTimers[index] = { ...updatedTimers[index], hours, minutes, seconds };
        setTimers(updatedTimers);
    };

    const handleReset = (index) => {
        clearInterval(intervalRefs.current[index]); // Clear any ongoing interval
        const updatedTimers = [...timers];
        updatedTimers[index].running = false;
        updatedTimers[index].hours = 0;
        updatedTimers[index].minutes = 0;
        updatedTimers[index].seconds = 0;
        updatedTimers[index].finished = false;
        setTimers(updatedTimers);
    };

    const handleTimerEnd = (index) => {
        // Show desktop notification
        if (Notification.permission === 'granted') {
            new Notification('Timer Ended', {
                body: `The timer "${timers[index].title}" has ended!`,
            });
        }

        // Play sound
        const audio = new Audio('src/assets/oversimplified-alarm-clock-113180.mp3'); // Replace with correct path
        audio.play();
        setPlayingAudio(audio); // Save the audio in state to control it

        // Mark timer as finished
        const updatedTimers = [...timers];
        updatedTimers[index].finished = true;
        setTimers(updatedTimers);
    };

    const handleStopRing = () => {
        if (playingAudio) {
            playingAudio.pause();
            playingAudio.currentTime = 0; // Reset audio to start
            setPlayingAudio(null); // Clear audio reference after stopping
        }
    };

    useEffect(() => {
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    return (
        <div className="container mx-auto p-4">
            <button
                onClick={addTimer}
                className='bg-black p-4 rounded-full mb-4'
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><g fill="none"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" /><path fill="white" d="M10.5 20a1.5 1.5 0 0 0 3 0v-6.5H20a1.5 1.5 0 0 0 0-3h-6.5V4a1.5 1.5 0 0 0-3 0v6.5H4a1.5 1.5 0 0 0 0 3h6.5z" /></g></svg>
            </button>

            {timers.map((timer, index) => (
                <div key={index} className="border p-4 mb-4 rounded shadow-lg bg-white">
                    <input
                        type="text"
                        placeholder="Timer Title"
                        className="border p-2 rounded w-full mb-2"
                        value={timer.title}
                        onChange={(e) => handleTimerChange(index, 'title', e.target.value)}
                    />
                    <div className="flex space-x-2 mb-2">
                        <input
                            type="number"
                            className="border p-2 rounded w-20 text-center"
                            placeholder="HH"
                            value={timer.hours}
                            onChange={(e) => handleTimerChange(index, 'hours', e.target.value)}
                            max="23"
                            disabled={timer.running || timer.finished}
                        />
                        <input
                            type="number"
                            className="border p-2 rounded w-20 text-center"
                            placeholder="MM"
                            value={timer.minutes}
                            onChange={(e) => handleTimerChange(index, 'minutes', e.target.value)}
                            max="59"
                            disabled={timer.running || timer.finished}
                        />
                        <input
                            type="number"
                            className="border p-2 rounded w-20 text-center"
                            placeholder="SS"
                            value={timer.seconds}
                            onChange={(e) => handleTimerChange(index, 'seconds', e.target.value)}
                            max="59"
                            disabled={timer.running || timer.finished}
                        />
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleStart(index)}
                            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${timer.running && 'opacity-50 cursor-not-allowed'}`}
                            disabled={timer.running || timer.finished}
                        >
                            Start
                        </button>
                        <button
                            onClick={() => handleReset(index)}
                            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Reset
                        </button>
                    </div>

                    {timer.finished && (
                        <p className="text-red-500 mt-2">Timer ended!</p>
                    )}
                </div>
            ))}

            {playingAudio && (
                <button
                    onClick={handleStopRing}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
                >
                    Stop Ring
                </button>
            )}

        </div>
    );
};

export default TimerComponent;
