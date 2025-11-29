// Fallback storage system when IPFS is not available
// Uses Supabase storage as backup

import { supabase } from './supabase'
import { retrieveFromPolygon } from './polygonStorage'

export const uploadToFallbackStorage = async (encryptedFileData, fileName, mimeType = 'application/octet-stream') => {
  try {
    console.log('📁 Using fallback storage (Supabase)...')
    
    // Convert encrypted data to blob
    const blob = new Blob([encryptedFileData], { type: mimeType })
    const timestamp = Date.now()
    const safeFileName = `encrypted_${timestamp}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // Try to upload to Supabase storage bucket
    const { data, error } = await supabase.storage
      .from('encrypted-files')
      .upload(safeFileName, blob, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      // If storage bucket doesn't exist or fails, store as base64 in database
      console.warn('Storage bucket upload failed, using database fallback:', error)
      return await storeInDatabase(encryptedFileData, fileName, mimeType)
    }

    console.log('✅ File stored in Supabase storage successfully')
    
    // Get public URL
    const { data: publicData } = supabase.storage
      .from('encrypted-files')
      .getPublicUrl(data.path)

    return {
      success: true,
      cid: `supabase_${data.path}`,
      url: publicData.publicUrl,
      gateway: publicData.publicUrl,
      storageType: 'supabase'
    }
  } catch (error) {
    console.error('❌ Fallback storage error:', error)
    // Final fallback: store in database
    return await storeInDatabase(encryptedFileData, fileName, mimeType)
  }
}

const storeInDatabase = async (encryptedFileData, fileName, mimeType) => {
  try {
    console.log('💾 Using database storage as final fallback...')
    
    // Convert to base64 for database storage
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(encryptedFileData)))
    const timestamp = Date.now()
    const dbId = `db_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
    
    // Store in a simple key-value table
    const { data, error } = await supabase
      .from('file_storage')
      .insert({
        id: dbId,
        file_name: fileName,
        mime_type: mimeType,
        file_data: base64Data,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Database storage failed: ${error.message}`)
    }

    console.log('✅ File stored in database successfully')
    
    return {
      success: true,
      cid: dbId,
      url: `database://${dbId}`,
      gateway: `database://${dbId}`,
      storageType: 'database'
    }
  } catch (error) {
    console.error('❌ Database storage error:', error)
    throw new Error(`All storage methods failed: ${error.message}`)
  }
}

export const retrieveFromFallbackStorage = async (cid, metadataHash = null) => {
  try {
    console.log('📁 Retrieving from storage:', cid)
    
    if (cid.startsWith('polygon_')) {
      // Retrieve from Polygon blockchain
      return await retrieveFromPolygon(cid, metadataHash)
    }
    
    if (cid.startsWith('supabase_')) {
      // Retrieve from Supabase storage
      const path = cid.replace('supabase_', '')
      const { data, error } = await supabase.storage
        .from('encrypted-files')
        .download(path)

      if (error) {
        throw new Error(`Supabase storage retrieval failed: ${error.message}`)
      }

      const arrayBuffer = await data.arrayBuffer()
      return {
        success: true,
        data: new Uint8Array(arrayBuffer),
        storageType: 'supabase'
      }
    } 
    
    if (cid.startsWith('db_')) {
      // Retrieve from database
      const { data, error } = await supabase
        .from('file_storage')
        .select('file_data')
        .eq('id', cid)
        .single()

      if (error) {
        throw new Error(`Database retrieval failed: ${error.message}`)
      }

      // Convert from base64 back to Uint8Array
      const binaryString = atob(data.file_data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      return {
        success: true,
        data: bytes,
        storageType: 'database'
      }
    }
    
    throw new Error('Unknown storage type')
  } catch (error) {
    console.error('❌ Storage retrieval error:', error)
    throw error
  }
}

export default {
  uploadToFallbackStorage,
  retrieveFromFallbackStorage
}