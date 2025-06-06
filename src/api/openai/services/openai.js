/**
 * OpenAI service to manage integration with OpenAI Assistants API
 */

const axios = require('axios');

module.exports = {
  /**
   * Upload content to OpenAI Assistants API as a file and add to vector store
   * @param {string} assistantId - The ID of the assistant to attach the file to
   * @param {object} content - The content from Strapi to upload
   * @param {string} filename - The name to give the file
   */
  async uploadContentAsFile(assistantId, content, filename) {
    console.log('uploadContentAsFile');
    try {
      // Verifica API key
      console.log('API Key configured:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
      console.log('Assistant ID:', assistantId);
      
      // Convert content to string if it's an object
      const contentStr = typeof content === 'object' ? JSON.stringify(content, null, 2) : content.toString();
      console.log(`Uploading content (${contentStr.length} bytes) as ${filename}`);
      
      // Create FormData for the file upload
      const formData = new FormData();
      const blob = new Blob([contentStr], { type: 'application/json' });
      formData.append('file', blob, filename);
      formData.append('purpose', 'assistants');
      
      // Upload file to OpenAI
      console.log('Uploading file to OpenAI...');
      const fileResponse = await axios.post('https://api.openai.com/v1/files', formData, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          // File upload doesn't need the beta header
        },
      });
      
      console.log('File uploaded successfully:', fileResponse.data.id);
      
      if (fileResponse.data.id) {
        try {
          // For Assistants v2, we need to add the file to a vector store and then configure the assistant
          await this.addFileToAssistantVectorStore(assistantId, fileResponse.data.id);
        } catch (attachError) {
          console.error('Error adding file to assistant vector store:', attachError.response?.data || attachError.message);
          // Clean up the orphaned file
          console.log(`Deleting orphaned file ${fileResponse.data.id}...`);
          await this.deleteFile(fileResponse.data.id);
          throw attachError;
        }
      }
      
      return fileResponse.data;
    } catch (error) {
      console.error('uploadContentAsFile error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Add a file to an assistant's vector store
   * @param {string} assistantId - The ID of the assistant
   * @param {string} fileId - The ID of the file to add
   */
  async addFileToAssistantVectorStore(assistantId, fileId) {
    console.log('addFileToAssistantVectorStore');
    try {
      // Verifica che il fileId sia valido
      if (!fileId || typeof fileId !== 'string') {
        throw new Error(`Invalid file_id: ${fileId}`);
      }

      // Verifica che l'assistantId sia valido
      if (!assistantId || typeof assistantId !== 'string') {
        throw new Error(`Invalid assistant_id: ${assistantId}`);
      }

      console.log(`Getting details for assistant ${assistantId}...`);
      
      // Get the assistant details
      const assistantResponse = await axios.get(
        `https://api.openai.com/v1/assistants/${assistantId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
            'Content-Type': 'application/json',
          },
        }
      );
      
      const assistant = assistantResponse.data;
      console.log(`Retrieved assistant: ${assistant.name || assistant.id}`);
      
      // Check if the assistant already has a vector store
      let vectorStoreId = null;
      
      if (assistant.tools && assistant.tools.length > 0) {
        const fileSearchTool = assistant.tools.find(tool => tool.type === 'file_search');
        if (fileSearchTool && 
            assistant.tool_resources && 
            assistant.tool_resources.file_search && 
            assistant.tool_resources.file_search.vector_store_ids && 
            assistant.tool_resources.file_search.vector_store_ids.length > 0) {
          vectorStoreId = assistant.tool_resources.file_search.vector_store_ids[0];
          console.log(`Found existing vector store: ${vectorStoreId}`);
        }
      }
      
      if (!vectorStoreId) {
        // Create a new vector store
        console.log('Creating new vector store...');
        const createVectorStoreResponse = await axios.post(
          `https://api.openai.com/v1/vector_stores`,
          {
            name: `VectorStore for ${assistant.name || assistant.id}`,
            file_ids: [fileId]
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2',
              'Content-Type': 'application/json',
            }
          }
        );
        
        vectorStoreId = createVectorStoreResponse.data.id;
        console.log(`Created new vector store: ${vectorStoreId}`);
        
        // Update the assistant with the new vector store
        const updateAssistantResponse = await axios.post(
          `https://api.openai.com/v1/assistants/${assistantId}`,
          {
            tools: [
              {
                type: "file_search"
              }
            ],
            tool_resources: {
              file_search: {
                vector_store_ids: [vectorStoreId]
              }
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2',
              'Content-Type': 'application/json',
            }
          }
        );
        
        console.log(`Updated assistant with new vector store`);
      } else {
        // Add the file to the existing vector store
        console.log(`Adding file to existing vector store: ${vectorStoreId}`);
        const updateVectorStoreResponse = await axios.post(
          `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`,
          {
            file_id: fileId
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2',
              'Content-Type': 'application/json',
            }
          }
        );
        
        console.log(`Added file to vector store successfully`);
      }
      
      console.log(`Assistant updated successfully with the new file.`);
      return { success: true, assistant_id: assistantId, file_id: fileId };
    } catch (error) {
      console.error('addFileToAssistantVectorStore error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * List all files associated with an assistant
   * @param {string} assistantId - The ID of the assistant
   */
  async listAssistantFiles(assistantId) {
    console.log('listAssistantFiles');
    try {
      console.log(`Listing files for assistant ${assistantId}...`);
      
      // Get the assistant details to find its vector store
      const assistantResponse = await axios.get(
        `https://api.openai.com/v1/assistants/${assistantId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
            'Content-Type': 'application/json',
          },
        }
      );
      
      const assistant = assistantResponse.data;
      console.log(`Retrieved assistant: ${assistant.name || assistant.id}`);
      
      // Get vector store ID if available
      let vectorStoreId = null;
      if (assistant.tools && assistant.tools.length > 0) {
        const fileSearchTool = assistant.tools.find(tool => tool.type === 'file_search');
        if (fileSearchTool && 
            assistant.tool_resources && 
            assistant.tool_resources.file_search && 
            assistant.tool_resources.file_search.vector_store_ids && 
            assistant.tool_resources.file_search.vector_store_ids.length > 0) {
          vectorStoreId = assistant.tool_resources.file_search.vector_store_ids[0];
        }
      }
      
      if (!vectorStoreId) {
        // No vector store found, return empty list
        console.log(`No vector store found for assistant ${assistantId}`);
        return {
          object: "list",
          data: [],
          first_id: "",
          last_id: "",
          has_more: false
        };
      }
      
      // Get files from the vector store
      console.log(`Getting files from vector store ${vectorStoreId}...`);
      const vectorStoreResponse = await axios.get(
        `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log(`Found ${vectorStoreResponse.data.data.length} files in vector store`);
      return vectorStoreResponse.data;
    } catch (error) {
      console.error('listAssistantFiles error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Retrieve file information from OpenAI
   * @param {string} fileId - The ID of the file to retrieve
   */
  async retrieveFile(fileId) {
    console.log('retrieveFile');
    try {
      console.log(`Retrieving file ${fileId} from OpenAI...`);
      const response = await axios.get(`https://api.openai.com/v1/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('retrieveFile error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Remove a file from an assistant's vector store
   * @param {string} assistantId - The ID of the assistant
   * @param {string} fileId - The ID of the file to remove
   */
  async removeFileFromAssistant(assistantId, fileId) {
    console.log('removeFileFromAssistant');
    try {
      console.log(`Removing file ${fileId} from assistant ${assistantId}...`);
      
      // Get the assistant details to find its vector store
      const assistantResponse = await axios.get(
        `https://api.openai.com/v1/assistants/${assistantId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
            'Content-Type': 'application/json',
          },
        }
      );
      
      const assistant = assistantResponse.data;
      
      // Get vector store ID
      let vectorStoreId = null;
      if (assistant.tools && assistant.tools.length > 0) {
        const fileSearchTool = assistant.tools.find(tool => tool.type === 'file_search');
        if (fileSearchTool && 
            assistant.tool_resources && 
            assistant.tool_resources.file_search && 
            assistant.tool_resources.file_search.vector_store_ids && 
            assistant.tool_resources.file_search.vector_store_ids.length > 0) {
          vectorStoreId = assistant.tool_resources.file_search.vector_store_ids[0];
        }
      }
      
      if (!vectorStoreId) {
        console.log(`No vector store found for assistant ${assistantId}`);
        return { success: false, message: "No vector store found for assistant" };
      }
      
      // Remove the file from the vector store
      console.log(`Removing file ${fileId} from vector store ${vectorStoreId}...`);
      const deleteResponse = await axios.delete(
        `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files/${fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log(`File removed from vector store successfully`);
      return { success: true, assistant_id: assistantId, file_id: fileId };
    } catch (error) {
      console.error('removeFileFromAssistant error:', error.response?.data || error.message);
      throw error;
    }
  },
  
  /**
   * Delete a file from OpenAI
   * @param {string} fileId - The ID of the file to delete
   */
  async deleteFile(fileId) {
    console.log('deleteFile');
    try {
      console.log(`Deleting file ${fileId} from OpenAI...`);
      const response = await axios.delete(`https://api.openai.com/v1/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          // File deletion doesn't need the beta header
        },
      });
      
      console.log('Delete response:', response.data);
      return response.data;
    } catch (error) {
      console.error('deleteFile error:', error.response?.data || error.message);
      throw error;
    }
  }
}; 