<template>
  <div class="profile-picture-upload">
    <div class="avatar-preview-section">
      <div class="avatar-preview">
        <div 
          v-if="!previewUrl && !currentAvatarUrl" 
          class="avatar-placeholder icon-box"
          :style="{ width: '150px', height: '150px', fontSize: 'var(--text-3xl)' }"
        >
          {{ userInitial }}
        </div>
        <img 
          v-else 
          :src="previewUrl || currentAvatarUrl" 
          alt="Profile picture" 
          class="avatar-image"
          :style="{ width: '150px', height: '150px' }"
        />
        
        <div v-if="cropping" class="cropping-overlay">
          <div class="cropping-message font-mono">
            <LoadingSpinner size="sm" message="Cropping image..." />
          </div>
        </div>
      </div>
      
      <div class="avatar-actions">
        <label class="btn btn-secondary cursor-pointer">
          <input 
            type="file" 
            accept="image/*" 
            class="sr-only" 
            @change="handleFileSelect"
            :disabled="uploading || cropping"
          />
          <span v-if="!uploading && !cropping">Choose Image</span>
          <span v-else-if="uploading" class="sr-only">Uploading...</span>
          <span v-else-if="cropping" class="sr-only">Cropping...</span>
        </label>
        
        <button 
          v-if="previewUrl && !cropping" 
          @click="cropImage" 
          class="btn btn-primary"
          :disabled="uploading"
        >
          Crop & Save
        </button>
        
        <button 
          v-if="previewUrl && !cropping" 
          @click="cancelUpload" 
          class="btn btn-ghost"
          :disabled="uploading"
        >
          Cancel
        </button>
      </div>
    </div>
    
    <div v-if="uploadError" class="error mt-2">{{ uploadError }}</div>
    <div v-if="uploadSuccess" class="success mt-2">{{ uploadSuccess }}</div>
    
    <!-- Image cropping modal (simplified implementation) -->
    <div v-if="showCropModal" class="crop-modal">
      <div class="crop-modal-content card">
        <h3 class="font-display">Crop Image</h3>
        <p class="font-mono text-sm mb-4">Adjust the crop area then apply.</p>
        
        <div class="crop-preview-container">
          <img ref="cropImageRef" :src="selectedFileUrl" alt="Image to crop" class="crop-source-image" />
        </div>
        
        <div class="crop-controls">
          <div class="zoom-control">
            <label class="font-mono text-sm">Zoom:</label>
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.1" 
              v-model="cropZoom" 
              @input="updateCropPreview"
              class="zoom-slider"
            />
          </div>
        </div>
        
        <div class="crop-actions">
          <button @click="applyCrop" class="btn btn-primary" :disabled="applyingCrop">
            <span v-if="!applyingCrop">Apply Crop</span>
            <span v-else class="sr-only">Applying...</span>
          </button>
          <button @click="cancelCrop" class="btn btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'
import { useSupabaseUser } from '#imports'

interface Props {
  currentAvatarUrl?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'avatar-updated': [avatarUrl: string]
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const uploading = ref(false)
const cropping = ref(false)
const applyingCrop = ref(false)
const uploadError = ref('')
const uploadSuccess = ref('')
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string>('')
const selectedFileUrl = ref<string>('')
const showCropModal = ref(false)
const cropZoom = ref(1)
const cropImageRef = ref<HTMLImageElement | null>(null)

const userInitial = computed(() => {
  if (!user.value) return 'U'
  const username = user.value.user_metadata?.username || user.value.email || 'U'
  return username.charAt(0).toUpperCase()
})

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Please select an image file'
    return
  }
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'Image must be less than 5MB'
    return
  }
  
  selectedFile.value = file
  selectedFileUrl.value = URL.createObjectURL(file)
  previewUrl.value = selectedFileUrl.value
  
  // Reset messages
  uploadError.value = ''
  uploadSuccess.value = ''
  
  // Show crop modal for new images
  showCropModal.value = true
}

const updateCropPreview = () => {
  // In a real implementation, this would update the crop preview
  // For this simplified version, we'll just update the zoom
  if (cropImageRef.value) {
    cropImageRef.value.style.transform = `scale(${cropZoom.value})`
  }
}

const cropImage = () => {
  // For now, we'll skip the actual cropping implementation
  // and just upload the image as-is
  showCropModal.value = true
}

const applyCrop = async () => {
  if (!selectedFile.value || !user.value) return
  
  applyingCrop.value = true
  cropping.value = true
  showCropModal.value = false
  
  try {
    // Generate unique filename
    const fileExt = selectedFile.value.name.split('.').pop()
    const fileName = `${user.value.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, selectedFile.value, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) throw uploadError
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath)
    
    const avatarUrl = urlData.publicUrl
    
    // Update profile with avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.value.id)
    
    if (updateError) throw updateError
    
    // Update preview
    previewUrl.value = avatarUrl
    
    // Emit event
    emit('avatar-updated', avatarUrl)
    
    // Show success message
    uploadSuccess.value = 'Profile picture updated successfully!'
    
  } catch (error: any) {
    console.error('Error uploading image:', error)
    uploadError.value = error.message || 'Failed to upload image'
  } finally {
    applyingCrop.value = false
    cropping.value = false
    selectedFile.value = null
    
    // Clean up object URL
    if (selectedFileUrl.value) {
      URL.revokeObjectURL(selectedFileUrl.value)
      selectedFileUrl.value = ''
    }
  }
}

const cancelCrop = () => {
  showCropModal.value = false
  cropZoom.value = 1
  
  // Clean up object URL
  if (selectedFileUrl.value) {
    URL.revokeObjectURL(selectedFileUrl.value)
    selectedFileUrl.value = ''
  }
  
  // Reset preview
  previewUrl.value = ''
  selectedFile.value = null
}

const cancelUpload = () => {
  // Clean up object URL
  if (selectedFileUrl.value) {
    URL.revokeObjectURL(selectedFileUrl.value)
    selectedFileUrl.value = ''
  }
  
  // Reset state
  previewUrl.value = ''
  selectedFile.value = null
  uploadError.value = ''
  uploadSuccess.value = ''
  showCropModal.value = false
}

onMounted(() => {
  // Clean up object URLs on unmount
  return () => {
    if (selectedFileUrl.value) {
      URL.revokeObjectURL(selectedFileUrl.value)
    }
  }
})
</script>

<style scoped>
.profile-picture-upload {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.avatar-preview-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

@media (min-width: 640px) {
  .avatar-preview-section {
    flex-direction: row;
    align-items: flex-start;
  }
}

.avatar-preview {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: var(--radius-full);
  overflow: hidden;
  border: 3px solid var(--color-accent);
  box-shadow: var(--shadow-lg);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-accent);
  color: var(--color-bg);
  font-weight: 800;
  font-family: var(--font-mono);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-full);
}

.cropping-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.cropping-message {
  color: white;
  text-align: center;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  flex: 1;
}

@media (min-width: 640px) {
  .avatar-actions {
    margin-top: var(--space-lg);
  }
}

.btn.cursor-pointer {
  cursor: pointer;
}

.crop-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-base);
}

.crop-modal-content {
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.crop-preview-container {
  width: 100%;
  height: 300px;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  margin-bottom: var(--space-base);
  position: relative;
}

.crop-source-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.2s ease;
}

.crop-controls {
  margin-bottom: var(--space-lg);
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: var(--space-base);
}

.zoom-slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border);
  outline: none;
  -webkit-appearance: none;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--color-bg);
}

.zoom-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  background: var(--color-accent);
  cursor: pointer;
  border: 2px solid var(--color-bg);
}

.crop-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

.success {
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  padding: var(--space-sm);
  background: rgba(61, 255, 224, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(61, 255, 224, 0.3);
}

.error {
  color: var(--color-accent3);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  padding: var(--space-sm);
  background: rgba(255, 91, 139, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 91, 139, 0.3);
}
</style>