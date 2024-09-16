import TimerComponent from './components/TimerComponent'
import timerLogo from './assets/timer.svg';

function App() {

  return (
    <div>
      <header
        className='py-8 px-20 bg-gray-200 flex items-center justify-center'
      >
        <img src={timerLogo}
          className='w-28'
        />
      </header>
      <TimerComponent />
    </div>
  )
}

export default App
