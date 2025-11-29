import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for database operations
export const getUserByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) {
      console.error('Error fetching user by email:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error fetching user by email:', error)
    return null
  }
}

export const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user by ID:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error fetching user by ID:', error)
    return null
  }
}

export const createUser = async (userData) => {
  try {
    // Don't try to create user profile - Supabase auth handles this
    // Just return success since auth.signUp already created the user
    console.log('User profile creation skipped - handled by Supabase Auth')
    return { success: true }
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

export const getSharedFiles = async (userId) => {
  try {
    // First get the user's own files
    const { data: ownFiles, error: ownError } = await supabase
      .from('files')
      .select('*')
      .eq('owner_id', userId)
    
    if (ownError) {
      console.error('Error fetching own files:', ownError)
      return []
    }

    // Get files shared with the user
    const { data: sharedPermissions, error: permError } = await supabase
      .from('permissions')
      .select(`
        file_id,
        granted_by,
        expires_at,
        status,
        files (*)
      `)
      .eq('recipient_id', userId)
      .eq('status', 'active')
    
    if (permError) {
      console.error('Error fetching shared files:', permError)
      return ownFiles || []
    }

    // Combine own files and shared files
    const sharedFiles = sharedPermissions?.map(perm => ({
      ...perm.files,
      shared: true,
      permission: {
        granted_by: perm.granted_by,
        expires_at: perm.expires_at
      }
    })) || []

    return [...(ownFiles || []), ...sharedFiles]
  } catch (error) {
    console.error('Error fetching shared files:', error)
    return []
  }
}

export const uploadFileRecord = async (fileData) => {
  try {
    const { data, error } = await supabase
      .from('files')
      .insert([fileData])
      .select()
      .single()
    
    if (error) {
      console.error('Error uploading file record:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error uploading file record:', error)
    return null
  }
}

export const createPermission = async (permissionData) => {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .insert([permissionData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating permission:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error creating permission:', error)
    return null
  }
}

export const uploadFile = async (filePath, encryptedFileData, fileName) => {
  try {
    // Files are now stored on IPFS, not in database
    // This function just validates the upload path
    console.log('📝 Processing file upload path:', filePath)
    
    return {
      path: filePath,
      id: Date.now().toString(),
      fullPath: filePath,
      fileName: fileName
    }
  } catch (error) {
    console.error('Error processing file path:', error)
    throw error
  }
}

export const downloadFile = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from('files')
      .download(filePath)
    
    if (error) {
      console.error('Error downloading file:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error downloading file:', error)
    return null
  }
}

export const deleteFileFromStorage = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('files')
      .remove([filePath])
    
    if (error) {
      console.error('Error deleting file from storage:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error deleting file from storage:', error)
    return false
  }
}

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export const signInWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Error signing in:', error)
      return { user: null, error }
    }
    
    return { user: data.user, error: null }
  } catch (error) {
    console.error('Error signing in:', error)
    return { user: null, error }
  }
}

export const signUpWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    
    if (error) {
      console.error('Error signing up:', error)
      return { user: null, error }
    }
    
    return { user: data.user, error: null }
  } catch (error) {
    console.error('Error signing up:', error)
    return { user: null, error }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error signing out:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error signing out:', error)
    return false
  }
}

export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    return null
  }
}