import { SpotlightWindow } from './components';
import { MockPromptService } from './services/MockPromptService';
import { TauriPromptService } from './services/TauriPromptService';

// Use mock service during development, Tauri service in production
const isDevelopment = import.meta.env.DEV;
const promptService = isDevelopment
  ? new MockPromptService()
  : new TauriPromptService();

function App() {
  return (
    <div className="w-[700px] h-[500px]">
      <SpotlightWindow service={promptService} />
    </div>
  )
}

export default App
