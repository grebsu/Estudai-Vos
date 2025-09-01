'use server';

import fs from 'fs/promises';
import path from 'path';

export interface StudyRecord {
  id: string; // Adicionado id
  date: string;
  subject: string;
  topic: string;
  studyTime: number; // in milliseconds
  questions: { correct: number; total: number };
  pages: string[];
  videos: string[];
  notes: string;
  category: string;
  reviewPeriods?: string[];
  teoriaFinalizada: boolean;
  countInPlanning: boolean;
}

export interface ReviewRecord {
  id: string;
  studyRecordId: string;
  scheduledDate: string;
  status: 'pending' | 'completed' | 'skipped';
  originalDate: string;
  subject: string;
  topic: string;
  reviewPeriod: string;
  completedDate?: string;
  ignored?: boolean;
}

export interface SimuladoSubject {
  name: string;
  weight: number;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  color: string;
}

export interface SimuladoRecord {
  id: string;
  date: string;
  name: string;
  style: string;
  banca: string;
  timeSpent: string;
  subjects: SimuladoSubject[];
  comments: string;
}

export interface Subject {
  subject: string;
  topics: { topic_text: string }[];
}

export interface PlanData {
  name: string;
  observations: string;
  cargo?: string;
  edital?: string;
  iconUrl?: string;
  subjects: Subject[];
  records?: StudyRecord[];
  reviewRecords?: ReviewRecord[];
  simuladoRecords?: SimuladoRecord[];
}

// Interface para os dados do ciclo de estudos
export interface StudyCycleData {
  studyCycle: any[] | null;
  studyHours: string;
  weeklyQuestionsGoal: string;
  currentProgressMinutes: number;
  sessionProgressMap: { [key: string]: number };
  reminderNotes: any[];
  studyDays: string[];
}


// Helper function to get the data directory path
function getDataDirectory() {
  return path.join(process.cwd(), 'src', 'data');
}

// --- Funções para o Ciclo de Estudos ---

// Salva os dados do ciclo de estudos em um arquivo .cycle.json
export async function saveStudyCycleToFile(planFileName: string, cycleData: StudyCycleData): Promise<{ success: boolean; error?: string }> {
  if (!planFileName) {
    return { success: false, error: 'Nome do arquivo do plano não fornecido.' };
  }
  const cycleFileName = planFileName.replace('.json', '.cycle.json');
  const filePath = path.join(getDataDirectory(), cycleFileName);
  try {
    await fs.writeFile(filePath, JSON.stringify(cycleData, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error(`Erro ao salvar o arquivo do ciclo ${cycleFileName}:`, error);
    return { success: false, error: 'Falha ao salvar o ciclo de estudos.' };
  }
}

// Carrega os dados do ciclo de estudos de um arquivo .cycle.json
export async function getStudyCycleFromFile(planFileName: string): Promise<StudyCycleData | null> {
  if (!planFileName) return null;
  const cycleFileName = planFileName.replace('.json', '.cycle.json');
  const filePath = path.join(getDataDirectory(), cycleFileName);
  try {
    await fs.access(filePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // Se o arquivo não existir (ENOENT), é um cenário normal (sem ciclo salvo ainda).
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
       console.error(`Erro ao ler o arquivo do ciclo ${cycleFileName}:`, error);
    }
    return null;
  }
}

// Deleta o arquivo .cycle.json associado a um plano
export async function deleteStudyCycleFile(planFileName: string): Promise<{ success: boolean; error?: string }> {
    if (!planFileName) {
    return { success: false, error: 'Nome do arquivo do plano não fornecido.' };
  }
  const cycleFileName = planFileName.replace('.json', '.cycle.json');
  const filePath = path.join(getDataDirectory(), cycleFileName);
  try {
    await fs.access(filePath); // Verifica se o arquivo existe antes de tentar deletar
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
     if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { success: true }; // Se não existe, consideramos a operação um sucesso.
    }
    console.error(`Erro ao deletar o arquivo do ciclo ${cycleFileName}:`, error);
    return { success: false, error: 'Falha ao deletar o arquivo do ciclo.' };
  }
}


// Get list of available JSON files
export async function getJsonFiles(): Promise<string[]> {
  const dataDir = getDataDirectory();
  try {
    const files = await fs.readdir(dataDir);
    // Filtra para incluir apenas arquivos .json, excluindo os .cycle.json
    return files.filter(file => file.endsWith('.json') && !file.endsWith('.cycle.json'));
  } catch (error) {
    console.error('Failed to read data directory:', error);
    return [];
  }
}

export async function deleteJsonFile(fileName: string): Promise<void> {
  const dataDir = getDataDirectory();
  const filePath = path.join(dataDir, fileName);
  try {
    await fs.unlink(filePath);
    console.log(`Successfully deleted ${fileName}`);
  } catch (error) {
    console.error(`Error deleting file ${fileName}:`, error);
    throw new Error(`Failed to delete plan: ${fileName}`);
  }
}

// Função para obter o conteúdo de um arquivo JSON específico
export async function getJsonContent(fileName: string) {
  if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
    console.error('getJsonContent called with invalid fileName:', fileName);
    return null;
  }
  try {
    const dataDir = getDataDirectory();
    const filePath = path.join(dataDir, fileName);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error);
    return null;
  }
}

// Save a study record to a file
export async function saveStudyRecord(fileName: string, record: StudyRecord): Promise<void> {
  try {
    const dataDir = getDataDirectory();
    const filePath = path.join(dataDir, fileName);
    console.log(`saveStudyRecord: Attempting to save to ${filePath}`);
    
    // eslint-disable-next-line prefer-const
    let planData: PlanData = await fs.access(filePath).then(async () => {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const parsedData = JSON.parse(fileContent);
      console.log("saveStudyRecord: Existing planData before modification:", parsedData);
      return parsedData;
    }).catch((error) => {
      console.warn(`saveStudyRecord: File ${filePath} not found or accessible, creating new PlanData. Error:`, error.message);
      return { name: '', observations: '', subjects: [] };
    });
    
    if (!planData.records) {
      planData.records = [];
      console.log("saveStudyRecord: Initialized planData.records as empty array.");
    }
    
    const existingIndex = planData.records.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      planData.records[existingIndex] = record;
      console.log(`saveStudyRecord: Updated existing record with ID ${record.id}.`);
    } else {
      planData.records.push(record);
      console.log(`saveStudyRecord: Added new record with ID ${record.id}.`);
    }
    
    console.log("saveStudyRecord: planData after modification (before writing):");
    // console.log(JSON.stringify(planData, null, 2)); // Uncomment for full data inspection if needed
    
    await fs.writeFile(filePath, JSON.stringify(planData, null, 2));
    console.log("saveStudyRecord: Successfully wrote data to file.");
  } catch (error) {
    console.error('Error saving study record:', error);
    throw error;
  }
}

// Get study records from a specific file
export async function getStudyRecords(fileName: string): Promise<StudyRecord[]> {
  try {
    const planData = await getJsonContent(fileName);
    return planData?.records || [];
  } catch (error) {
    console.error('Error reading study records:', error);
    return [];
  }
}

// Save a review record to a file
export async function saveReviewRecord(fileName: string, record: ReviewRecord): Promise<void> {
  try {
    const dataDir = getDataDirectory();
    const filePath = path.join(dataDir, fileName);
    
    // eslint-disable-next-line prefer-const
    const planData: PlanData = await fs.access(filePath).then(async () => {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }).catch(() => {
      return { name: '', observations: '', subjects: [] };
    });
    
    if (!planData.reviewRecords) {
      planData.reviewRecords = [];
    }
    
    const existingIndex = planData.reviewRecords.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      planData.reviewRecords[existingIndex] = record;
    } else {
      planData.reviewRecords.push(record);
    }
    
    await fs.writeFile(filePath, JSON.stringify(planData, null, 2));
  } catch (error) {
    console.error('Error saving review record:', error);
    throw error;
  }
}

// Get review records from a specific file
export async function getReviewRecords(fileName: string): Promise<ReviewRecord[]> {
  try {
    const planData = await getJsonContent(fileName);
    return planData?.reviewRecords || [];
  } catch (error) {
    console.error('Error reading review records:', error);
    return [];
  }
}

// Save a simulado record to a file
export async function saveSimuladoRecord(fileName: string, record: SimuladoRecord): Promise<void> {
  try {
    const dataDir = getDataDirectory();
    const filePath = path.join(dataDir, fileName);

    let planData: PlanData = await fs.access(filePath).then(async () => {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }).catch((error) => {
      console.warn(`saveSimuladoRecord: File ${filePath} not found or accessible, creating new PlanData. Error:`, error.message);
      return { name: '', observations: '', subjects: [] };
    });

    if (!planData.simuladoRecords) {
      planData.simuladoRecords = [];
    }

    const existingIndex = planData.simuladoRecords.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      planData.simuladoRecords[existingIndex] = record;
    } else {
      planData.simuladoRecords.push(record);
    }

    await fs.writeFile(filePath, JSON.stringify(planData, null, 2));
    console.log("saveSimuladoRecord: Successfully wrote data to file.");
  } catch (error) {
    console.error('Error saving simulado record:', error);
    throw error;
  }
}

// Get simulado records from a specific file
export async function getSimuladoRecords(fileName: string): Promise<SimuladoRecord[]> {
  try {
    const planData = await getJsonContent(fileName);
    return planData?.simuladoRecords || [];
  } catch (error) {
    console.error('Error reading simulado records:', error);
    return [];
  }
}

export async function migrateStudyRecordIds(fileName: string) {
  const filePath = path.join(process.cwd(), 'src', 'data', fileName);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data || !Array.isArray(data.records)) {
      return { success: true, migrated: false };
    }

    let recordsChanged = false;
    const updatedRecords = data.records.map((record: any) => {
      if (!record.id) {
        recordsChanged = true;
        return {
          ...record,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-migrated`
        };
      }
      return record;
    });

    if (recordsChanged) {
      console.log(`Migrating IDs for ${fileName}...`);
      data.records = updatedRecords;
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`Migration complete for ${fileName}.`);
      return { success: true, migrated: true };
    }

    return { success: true, migrated: false };
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return { success: true, migrated: false };
    }
    console.error(`Error migrating IDs for ${fileName}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

// Delete a study record from a file
export async function deleteStudyRecordAction(fileName: string, recordId: string): Promise<void> {
  try {
    const dataDir = getDataDirectory();
    const filePath = path.join(dataDir, fileName);

    let planData: PlanData | null = await getJsonContent(fileName);

    if (planData && planData.records) {
      console.log(`Attempting to delete record with ID: ${recordId}`);
      console.log('Current records IDs:', planData.records.map(r => r.id));
      const initialLength = planData.records.length;
      planData.records = planData.records.filter(r => r.id !== recordId);
      
      if (planData.records.length < initialLength) {
        console.log(`Study record with ID ${recordId} found and will be removed.`);
        console.log('Review records before filtering:', planData.reviewRecords?.map(rr => rr.id));
        // Remove associated review records
        if (planData.reviewRecords) {
          planData.reviewRecords = planData.reviewRecords.filter(rr => rr.studyRecordId !== recordId);
        }
        console.log('Review records after filtering:', planData.reviewRecords?.map(rr => rr.id));
        await fs.writeFile(filePath, JSON.stringify(planData, null, 2));
        console.log(`File ${fileName} updated successfully after deleting study record and associated review records.`);
      } else {
        console.warn(`Record with id ${recordId} not found in ${fileName}. No changes made.`);
      }
    }
  } catch (error) {
    console.error('Error deleting study record:', error);
    throw error;
  }
}

export async function createPlanFile(formData: FormData): Promise<{ success: boolean; fileName?: string; error?: string }> {
  const planName = formData.get('name') as string;
  const observations = formData.get('observations') as string;
  const cargo = (formData.get('cargo') as string) || '';
  const edital = (formData.get('edital') as string) || '';
  const imageFile = formData.get('image') as File;

  if (!planName || planName.trim() === '') {
    return { success: false, error: 'O nome do plano não pode estar vazio.' };
  }

  const sanitizedPlanName = planName.trim().toLowerCase().replace(/\s+/g, '-');
  const jsonFileName = `${sanitizedPlanName}.json`;
  const jsonFilePath = path.join(getDataDirectory(), jsonFileName);

  // Verifica se o arquivo já existe
  try {
    await fs.access(jsonFilePath);
    return { success: false, error: `O plano '${planName}' já existe.` };
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      console.error('Erro ao verificar arquivo existente:', error);
      return { success: false, error: 'Erro interno do servidor.' };
    }
  }

  let iconUrl: string | undefined = undefined;

  // Lógica para salvar a imagem
  if (imageFile && imageFile.size > 0) {
    try {
      const publicDir = path.join(process.cwd(), 'public', 'plan-icons');
      await fs.mkdir(publicDir, { recursive: true }); // Garante que o diretório exista

      const imageExtension = path.extname(imageFile.name);
      const imageFileName = `${sanitizedPlanName}-${Date.now()}${imageExtension}`;
      const imageFilePath = path.join(publicDir, imageFileName);
      
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await fs.writeFile(imageFilePath, buffer);

      iconUrl = `/plan-icons/${imageFileName}`; // URL pública para a imagem
      console.log(`Imagem salva com sucesso em: ${iconUrl}`);
    } catch (error) {
      console.error('Erro ao salvar a imagem:', error);
      return { success: false, error: 'Falha ao salvar a imagem do plano.' };
    }
  }

  // Conteúdo inicial do plano
  const planContent: PlanData = {
    name: planName.trim(),
    observations: observations.trim(),
    cargo: cargo.trim(),
    edital: edital.trim(),
    iconUrl: iconUrl,
    subjects: [], // Começa com uma lista de matérias vazia
    records: [],
    reviewRecords: [],
  };

  const initialJsonContent = JSON.stringify(planContent, null, 2);

  try {
    await fs.writeFile(jsonFilePath, initialJsonContent, 'utf-8');
    console.log(`Arquivo do plano criado com sucesso: ${jsonFileName}`);
    return { success: true, fileName: jsonFileName };
  } catch (error) {
    console.error(`Erro ao criar o arquivo do plano ${jsonFileName}:`, error);
    return { success: false, error: 'Falha ao criar o arquivo do plano.' };
  }
}

export async function updatePlanFile(fileName: string, updatedData: Partial<PlanData>): Promise<{ success: boolean; error?: string }> {
  if (!fileName || fileName.trim() === '') {
    return { success: false, error: 'File name cannot be empty.' };
  }

  const jsonFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  const jsonFilePath = path.join(getDataDirectory(), jsonFileName);

  try {
    const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
    const currentData: PlanData = JSON.parse(fileContent);
    const newData = { ...currentData, ...updatedData };
    const updatedContent = JSON.stringify(newData, null, 2);
    await fs.writeFile(jsonFilePath, updatedContent, 'utf-8');
    console.log(`Successfully updated plan file: ${jsonFileName}`);
    return { success: true };
  } catch (error) {
    console.error(`Error updating plan file ${jsonFileName}:`, error);
    return { success: false, error: 'Failed to update the plan file.' };
  }
}

export async function deletePlanFile(fileName: string): Promise<{ success: boolean; error?: string }> {
  if (!fileName || fileName.trim() === '') {
    return { success: false, error: 'File name cannot be empty.' };
  }

  const jsonFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  const jsonFilePath = path.join(getDataDirectory(), jsonFileName);

  try {
    await fs.unlink(jsonFilePath);
    console.log(`Successfully deleted plan file: ${jsonFileName}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting plan file ${jsonFileName}:`, error);
    return { success: false, error: 'Failed to delete the plan file.' };
  }
}

export async function uploadImage(formData: FormData): Promise<{ success: boolean; iconUrl?: string; error?: string }> {
  const imageFile = formData.get('imageFile') as File;
  const baseName = formData.get('baseName') as string;

  if (!imageFile || imageFile.size === 0) {
    return { success: false, error: 'No image file provided.' };
  }

  if (!baseName) {
    return { success: false, error: 'Base name for the image was not provided.' };
  }

  try {
    const publicDir = path.join(process.cwd(), 'public', 'plan-icons');
    await fs.mkdir(publicDir, { recursive: true }); // Ensure directory exists

    // Sanitize baseName to create a friendly file name
    const sanitizedBaseName = baseName.trim().toLowerCase().replace(/\s+/g, '-');
    const imageExtension = path.extname(imageFile.name);
    const imageFileName = `${sanitizedBaseName}-${Date.now()}${imageExtension}`;
    const imageFilePath = path.join(publicDir, imageFileName);
    
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await fs.writeFile(imageFilePath, buffer);

    const iconUrl = `/plan-icons/${imageFileName}`;
    console.log(`Image saved successfully at: ${iconUrl}`);
    return { success: true, iconUrl };
  } catch (error) {
    console.error('Error saving image:', error);
    return { success: false, error: 'Failed to save the image.' };
  }
}

export async function updateSimuladoRecord(fileName: string, record: SimuladoRecord): Promise<void> {
  try {
    const dataDir = getDataDirectory();
    const filePath = path.join(dataDir, fileName);

    let planData: PlanData = await fs.access(filePath).then(async () => {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }).catch((error) => {
      console.warn(`updateSimuladoRecord: File ${filePath} not found or accessible, creating new PlanData. Error:`, error.message);
      return { name: '', observations: '', subjects: [] };
    });

    if (!planData.simuladoRecords) {
      planData.simuladoRecords = [];
    }

    const existingIndex = planData.simuladoRecords.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      planData.simuladoRecords[existingIndex] = record;
    } else {
      console.warn(`Simulado record with ID ${record.id} not found for update. Adding as new record.`);
      planData.simuladoRecords.push(record);
    }

    await fs.writeFile(filePath, JSON.stringify(planData, null, 2));
    console.log("updateSimuladoRecord: Successfully wrote data to file.");
  } catch (error) {
    console.error('Error updating simulado record:', error);
    throw error;
  }
}

export async function deleteSimuladoRecordAction(fileName: string, recordId: string): Promise<void> {
  try {
    const dataDir = getDataDirectory();
    const filePath = path.join(dataDir, fileName);

    let planData: PlanData | null = await getJsonContent(fileName);

    if (planData && planData.simuladoRecords) {
      const initialLength = planData.simuladoRecords.length;
      planData.simuladoRecords = planData.simuladoRecords.filter(r => r.id !== recordId);
      
      if (planData.simuladoRecords.length < initialLength) {
        await fs.writeFile(filePath, JSON.stringify(planData, null, 2));
        console.log(`File ${fileName} updated successfully after deleting simulado record.`);
      } else {
        console.warn(`Simulado record with id ${recordId} not found in ${fileName}. No changes made.`);
      }
    }
  } catch (error) {
    console.error('Error deleting simulado record:', error);
    throw error;
  }
}

export async function exportFullBackupAction(): Promise<any> {
  const dataDir = getDataDirectory();
  const planFiles = await getJsonFiles();
  const allPlansData = [];

  for (const fileName of planFiles) {
    const planContent = await getJsonContent(fileName);
    if (planContent) {
      allPlansData.push({
        fileName: fileName,
        content: planContent,
      });
    }
  }
  return { plans: allPlansData };
}

export async function restoreFullBackupAction(backupData: { plans: { fileName: string, content: any }[] }): Promise<{ success: boolean; error?: string }> {
  const dataDir = getDataDirectory();

  try {
    // 1. Clear the existing data directory
    const existingFiles = await fs.readdir(dataDir);
    for (const file of existingFiles) {
      if (file.endsWith('.json')) {
        await fs.unlink(path.join(dataDir, file));
      }
    }

    // 2. Restore plans from backup
    if (!backupData.plans || !Array.isArray(backupData.plans)) {
      throw new Error("Backup data is missing 'plans' array or is invalid.");
    }

    for (const plan of backupData.plans) {
      const filePath = path.join(dataDir, plan.fileName);
      await fs.writeFile(filePath, JSON.stringify(plan.content, null, 2), 'utf-8');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error during backup restoration:', error);
    return { success: false, error: error.message || 'Failed to restore backup.' };
  }
}

export async function exportAllDataAction(): Promise<any> {
  const dataDir = getDataDirectory();
  const planFiles = await getJsonFiles();
  const allPlansData = [];

  for (const fileName of planFiles) {
    const planContent = await getJsonContent(fileName);
    if (planContent) {
      allPlansData.push({
        fileName: fileName,
        content: planContent,
      });
    }
  }
  return { plans: allPlansData };
}

export async function updateTopicWeightAction(
  fileName: string,
  subjectName: string,
  topicText: string,
  newWeight: number
): Promise<{ success: boolean; error?: string }> {
  if (!fileName || !subjectName || !topicText || newWeight === undefined) {
    return { success: false, error: 'Parâmetros inválidos.' };
  }

  const filePath = path.join(getDataDirectory(), fileName);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const planData: PlanData = JSON.parse(fileContent);

    const subject = planData.subjects.find(s => s.subject === subjectName);
    if (!subject) {
      return { success: false, error: `Matéria '${subjectName}' não encontrada.` };
    }

    const topic = subject.topics.find((t: any) => t.topic_text === topicText);
    if (!topic) {
      return { success: false, error: `Tópico '${topicText}' não encontrado.` };
    }

    // Adiciona ou atualiza o peso do usuário
    (topic as any).userWeight = newWeight;

    await fs.writeFile(filePath, JSON.stringify(planData, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar o peso do tópico:', error);
    return { success: false, error: error.message || 'Falha ao atualizar o peso do tópico.' };
  }
}