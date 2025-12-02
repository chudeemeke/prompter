// Tauri commands - Presentation layer
// Thin wrappers that delegate to use cases

use crate::storage::{
    FilePromptRepository, FrecencyCalculator, FuzzySearchService,
    Prompt, PromptId, PromptRepository, RecordUsageUseCase, SavePromptUseCase,
    SearchPromptsUseCase, SearchResult,
};

#[tauri::command(rename_all = "snake_case")]
pub async fn get_all_prompts() -> Result<Vec<Prompt>, String> {
    let repository = FilePromptRepository::new()?;
    repository.find_all()
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_prompt(id: String) -> Result<Prompt, String> {
    let repository = FilePromptRepository::new()?;
    repository.find_by_id(&PromptId::new(id))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn search_prompts(query: String) -> Result<Vec<SearchResult>, String> {
    let repository = FilePromptRepository::new()?;
    let search_service = FuzzySearchService::new();
    let frecency = FrecencyCalculator::new()?;

    let use_case = SearchPromptsUseCase::new(repository, search_service, frecency);
    use_case.execute(&query)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn save_prompt(prompt: Prompt) -> Result<(), String> {
    let repository = FilePromptRepository::new()?;
    let use_case = SavePromptUseCase::new(repository);
    use_case.execute(&prompt)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn record_usage(prompt_id: String) -> Result<(), String> {
    let frecency = FrecencyCalculator::new()?;
    let mut use_case = RecordUsageUseCase::new(frecency);
    use_case.execute(&PromptId::new(prompt_id))
}

