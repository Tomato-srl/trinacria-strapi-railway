/**
 * Lifecycle hooks for the operator content-type
 * Used to synchronize operator data with OpenAI
 */

// Importiamo direttamente la configurazione
import openaiConfig from '../../../../../config/openai';

export default {
  /**
   * Lifecycle hook that runs after an operator is created
   */
  async afterCreate(event) {
    console.log('afterCreate');
    const { result } = event;
    console.log('afterCreate', result);
    await syncOperatorWithOpenAI(result);
  },

  // /**
  //  * Lifecycle hook that runs after an operator is updated
  //  */
  async afterUpdate(event) {
    console.log('afterUpdate');
    const { result } = event;
    console.log('afterUpdate', result);
    await syncOperatorWithOpenAI(result);
  },

  // /**
  //  * Lifecycle hook that runs after an operator is deleted
  //  */
  async afterDelete(event) {
    console.log('afterDelete');
    const { result } = event;
    console.log('afterDelete', result);
    await deleteOperatorFromOpenAI(result);
  },
};

/**
 * Helper function to delete operator data from OpenAI
 */
async function deleteOperatorFromOpenAI(operator) {
  try {
    // Get OpenAI service and configuration
    const openaiService = strapi.service('api::openai.openai');
    
    // Utilizziamo la configurazione importata direttamente
    const config = openaiConfig({ env: (key) => process.env[key] });
    
    // Check if the service and configuration exist
    if (!openaiService || !config) {
      console.error('OpenAI service or configuration not found');
      return;
    }
    
    // Prepariamo il pattern del filename che stiamo cercando
    const filename = `operator_${operator.id}.json`;
    
    console.log(`Looking for file to delete for operator ${operator.id}...`);
    
    // Otteniamo tutti i file associati all'assistente
    const assistantFiles = await openaiService.listAssistantFiles(config.assistantId);
    
    // Cerchiamo se esiste un file per questo operatore
    if (assistantFiles && assistantFiles.data) {
      for (const file of assistantFiles.data) {
        // Otteniamo i metadati del file per verificare il nome
        const fileInfo = await openaiService.retrieveFile(file.id);
        if (fileInfo.filename === filename) {
          // Se troviamo il file, lo cancelliamo
          console.log(`Removing file for deleted operator ${operator.id}...`);
          await openaiService.removeFileFromAssistant(config.assistantId, file.id);
          await openaiService.deleteFile(file.id);
          console.log(`Successfully removed file for deleted operator ${operator.id}`);
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error deleting operator from OpenAI:', error.message || 'Unknown error');
  }
}

/**
 * Helper function to sync operator data with OpenAI
 */
async function syncOperatorWithOpenAI(operator) {
  try {
    // Get OpenAI service and configuration
    const openaiService = strapi.service('api::openai.openai');
    
    // Utilizziamo la configurazione importata direttamente
    const config = openaiConfig({ env: (key) => process.env[key] });
    
    // Check if the service and configuration exist
    if (!openaiService || !config) {
      console.error('OpenAI service or configuration not found');
      return;
    }
    
    // Prepariamo il pattern del filename che stiamo cercando
    const filename = `operator_${operator.id}.json`;
    
    // Otteniamo tutti i file associati all'assistente
    const assistantFiles = await openaiService.listAssistantFiles(config.assistantId);
    
    // Cerchiamo se esiste già un file per questo operatore
    if (assistantFiles && assistantFiles.data) {
      for (const file of assistantFiles.data) {
        // Otteniamo i metadati del file per verificare il nome
        const fileInfo = await openaiService.retrieveFile(file.id);
        if (fileInfo.filename === filename) {
          // Se troviamo il file, lo cancelliamo
          console.log(`Removing existing file for operator ${operator.id}...`);
          await openaiService.removeFileFromAssistant(config.assistantId, file.id);
          await openaiService.deleteFile(file.id);
          break;
        }
      }
    }
    
    // Prepare operator data to be sent to OpenAI
    // We're only including fields that are relevant for the assistant
    const operatorData = {
      id: operator.id,
      id_operator: operator.id_operator,
      title: operator.title,
      description: operator.description,
      address: operator.address,
      district: operator.district,
      type: operator.type,
      phone: operator.phone,
      email: operator.email,
      website: operator.website,
      // Format location data if needed
      location: operator.location,
    };
    
    console.log(`Syncing operator ${operator.id} with OpenAI Assistant...`);
    
    // Upload content to OpenAI and attach it to the assistant
    const fileResponse = await openaiService.uploadContentAsFile(
      config.assistantId || '',
      operatorData,
      filename
    );
    
    // Log success to console instead of using content-type
    console.log(`Successfully synced operator ${operator.id} with OpenAI Assistant. File ID: ${fileResponse.id}`);
    
  } catch (error) {
    console.error('Error syncing operator with OpenAI:', error.message || 'Unknown error');
  }
} 