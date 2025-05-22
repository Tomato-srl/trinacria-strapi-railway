// Importiamo la configurazione OpenAI
const openaiConfig = require('../../../../config/openai');

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
    if (!openaiService) {
      console.error('OpenAI service not found');
      return;
    }
    
    if (!config.assistantId) {
      console.error('OpenAI Assistant ID not configured. Set OPENAI_ASSISTANT_ID env variable.');
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
    console.log('syncOperatorWithOpenAI 0');
    // Get OpenAI service and configuration
    const openaiService = strapi.service('api::openai.openai');
    console.log('syncOperatorWithOpenAI 1');
    
    // Utilizziamo la configurazione importata direttamente
    const config = openaiConfig({ env: (key) => process.env[key] });
    console.log('syncOperatorWithOpenAI 2');
    
    // Check if the service and configuration exist
    if (!openaiService) {
      console.error('OpenAI service not found');
      return;
    }
    console.log('syncOperatorWithOpenAI 3');
    if (!config.assistantId) {
      console.error('OpenAI Assistant ID not configured. Set OPENAI_ASSISTANT_ID env variable.');
      return;
    }
    console.log('syncOperatorWithOpenAI 4');
    // Prepariamo il pattern del filename che stiamo cercando
    const filename = `operator_${operator.id}.json`;
    console.log('syncOperatorWithOpenAI 5');
    // Otteniamo tutti i file associati all'assistente
    const assistantFiles = await openaiService.listAssistantFiles(config.assistantId);
    console.log('syncOperatorWithOpenAI 6');
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
    console.log('syncOperatorWithOpenAI 7');
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
    console.log('syncOperatorWithOpenAI 8');
    console.log(`Syncing operator ${operator.id} with OpenAI Assistant...`);
    
    // Upload content to OpenAI and attach it to the assistant
    const fileResponse = await openaiService.uploadContentAsFile(
      config.assistantId,
      operatorData,
      filename
    );
    console.log('syncOperatorWithOpenAI 9');
    // Log success to console instead of using content-type
    console.log(`Successfully synced operator ${operator.id} with OpenAI Assistant. File ID: ${fileResponse.id}`);
    console.log('syncOperatorWithOpenAI 10');
  } catch (error) {
    console.error('Error syncing operator with OpenAI:', error.message || 'Unknown error');
  }
}

module.exports = {
  afterCreate(event) {
    const { result, params } = event;
    console.log('Operator afterCreate hook triggered');
    console.log('Created operator ID:', result.id);
    console.log('Created operator data:', result);
    
    // Chiamata all'API di OpenAI per sincronizzare l'operatore
    syncOperatorWithOpenAI(result);
  },

  afterUpdate(event) {
    const { result, params } = event;
    console.log('Operator afterUpdate hook triggered');
    console.log('Updated operator ID:', result.id);
    console.log('Updated operator data:', result);
    
    // Chiamata all'API di OpenAI per sincronizzare l'operatore aggiornato
    syncOperatorWithOpenAI(result);
  },

  afterDelete(event) {
    const { result, params } = event;
    console.log('Operator afterDelete hook triggered');
    console.log('Deleted operator ID:', result.id);
    console.log('Deleted operator data:', result);
    
    // Chiamata all'API di OpenAI per rimuovere i dati dell'operatore
    deleteOperatorFromOpenAI(result);
  }
};