import { SpotlightWindow } from './components';
import { MockPromptService } from './services/MockPromptService';
import { TauriPromptService } from './services/TauriPromptService';

// TEMPORARY: Force Tauri service for testing actual paste functionality
// Once testing is complete, restore the conditional logic below
const promptService = new TauriPromptService();

// Use mock service during development, Tauri service in production
// const isDevelopment = import.meta.env.DEV;
// const promptService = isDevelopment
//   ? new MockPromptService()
//   : new TauriPromptService();

function App() {
  return (
    <div className="w-[700px] h-[500px]">
      <SpotlightWindow service={promptService} />
    </div>
  )
}

export default App
