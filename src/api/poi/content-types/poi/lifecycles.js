// Import OpenAI configuration
const openaiConfig = require('../../../../config/openai');

/**
 * Helper function to delete poi data from OpenAI
 */
async function deletePOIFromOpenAI(poi) {
  try {
    // Get OpenAI service and configuration
    const openaiService = strapi.service('api::openai.openai');
    
    // Use the imported configuration directly
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
    
    // Prepare the filename pattern we're looking for
    const filename = `poi_${poi.documentId}.json`;
    
    console.log(`Looking for file to delete for poi ${poi.documentId}...`);
    
    // Get all files associated with the assistant
    const assistantFiles = await openaiService.listAssistantFiles(config.assistantId);
    
    // Check if a file exists for this poi
    if (assistantFiles && assistantFiles.data) {
      for (const file of assistantFiles.data) {
        // Get file metadata to verify the name
        const fileInfo = await openaiService.retrieveFile(file.id);
        if (fileInfo.filename === filename) {
          // If we find the file, delete it
          console.log(`Removing file for deleted poi ${poi.documentId}...`);
          await openaiService.removeFileFromAssistant(config.assistantId, file.id);
          await openaiService.deleteFile(file.id);
          console.log(`Successfully removed file for deleted poi ${poi.documentId}`);
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error deleting poi from OpenAI:', error.message || 'Unknown error');
  }
}

/**
 * Helper function to sync poi data with OpenAI
 */
async function syncPOIWithOpenAI(poi) {
  try {
    console.log('syncPOIWithOpenAI 0');
    // Get OpenAI service and configuration
    const openaiService = strapi.service('api::openai.openai');
    console.log('syncPOIWithOpenAI 1');
    
    // Use the imported configuration directly
    const config = openaiConfig({ env: (key) => process.env[key] });
    console.log('syncPOIWithOpenAI 2');
    
    // Check if the service and configuration exist
    if (!openaiService) {
      console.error('OpenAI service not found');
      return;
    }
    console.log('syncPOIWithOpenAI 3');
    if (!config.assistantId) {
      console.error('OpenAI Assistant ID not configured. Set OPENAI_ASSISTANT_ID env variable.');
      return;
    }
    console.log('syncPOIWithOpenAI 4');
    // Prepare the filename pattern we're looking for
    const filename = `poi_${poi.documentId}.json`;
    console.log('syncPOIWithOpenAI 5');
    // Get all files associated with the assistant
    const assistantFiles = await openaiService.listAssistantFiles(config.assistantId);
    console.log('syncPOIWithOpenAI 6');
    // Check if a file already exists for this poi
    if (assistantFiles && assistantFiles.data) {
      for (const file of assistantFiles.data) {
        // Get file metadata to verify the name
        const fileInfo = await openaiService.retrieveFile(file.id);
        if (fileInfo.filename === filename) {
          // If we find the file, delete it
          console.log(`Removing existing file for poi ${poi.documentId}...`);
          await openaiService.removeFileFromAssistant(config.assistantId, file.id);
          await openaiService.deleteFile(file.id);
          break;
        }
      }
    }
    console.log('syncPOIWithOpenAI 7');
    // Prepare poi data to be sent to OpenAI
    // We're only including fields that are relevant for the assistant
    const poiData = {
      id: poi.id,
      documentId: poi.documentId,
      title: poi.title,
      description: poi.description,
      address: poi.address,
      type: poi.type,
      location: poi.location,
      phone: poi.phone,
      email: poi.email,
      website: poi.website,
      facebook: poi.facebook,
      instagram: poi.instagram,
      token: poi.token,
      wallet_address: poi.wallet_address,
      // Format location data if needed
    };
    console.log('syncPOIWithOpenAI 8');
    console.log(`Syncing poi ${poi.documentId} with OpenAI Assistant...`);
    
    // Upload content to OpenAI and attach it to the assistant
    const fileResponse = await openaiService.uploadContentAsFile(
      config.assistantId,
      poiData,
      filename
    );
    console.log('syncPOIWithOpenAI 9');
    // Log success to console instead of using content-type
    console.log(`Successfully synced poi ${poi.documentId} with OpenAI Assistant. File ID: ${fileResponse.id}`);
    console.log('syncPOIWithOpenAI 10');
  } catch (error) {
    console.error('Error syncing poi with OpenAI:', error.message || 'Unknown error');
  }
}

module.exports = {
  afterCreate(event) {
    const { result, params } = event;
    console.log('POI afterCreate hook triggered');
    console.log('Created poi documentId:', result.documentId);
    console.log('Created poi data:', result);
    
    // Call OpenAI API to sync the poi
    syncPOIWithOpenAI(result);
  },

  afterUpdate(event) {
    const { result, params } = event;
    console.log('POI afterUpdate hook triggered');
    console.log('Updated poi documentId:', result.documentId);
    console.log('Updated poi data:', result);
    
    // Call OpenAI API to sync the updated poi
    syncPOIWithOpenAI(result);
  },

  afterDelete(event) {
    const { result, params } = event;
    console.log('POI afterDelete hook triggered');
    console.log('Deleted poi documentId:', result.documentId);
    console.log('Deleted poi data:', result);
    
    // Call OpenAI API to remove poi data
    deletePOIFromOpenAI(result);
  }
};