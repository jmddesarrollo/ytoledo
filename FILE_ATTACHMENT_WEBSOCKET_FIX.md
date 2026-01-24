# File Attachment WebSocket Fix

## Problem Identified

The file attachment functionality was failing during validation with the error:
```
Error al adjuntar el archivo: El archivo debe tener un nombre válido
```

### Root Cause

The issue was that File objects cannot be properly serialized through WebSocket (Socket.IO) connections. When a File object is sent through WebSocket, it gets serialized to JSON, which strips away all the File object's properties like `name`, `size`, `type`, etc., leaving only a Buffer with the file data.

### Debug Evidence

The debug logs showed:
```javascript
{
  file: Buffer,
  hasName: false,
  name: undefined,
  hasData: true,
  size: undefined
}
```

This indicated that the file data was present but all metadata was lost during transmission.

## Solution Implemented

### 1. Frontend Fix - File Processing

Modified `file-attachment.component.ts` to properly process files before sending through WebSocket:

```typescript
private async uploadFile(): Promise<void> {
  // Read the file as ArrayBuffer (similar to existing system)
  const fileData = await this.readFileAsArrayBuffer(this.selectedFile);
  
  // Create object compatible with backend
  const fileObject = {
    name: this.selectedFile.name,
    size: this.selectedFile.size,
    type: this.selectedFile.type,
    lastModified: this.selectedFile.lastModified,
    data: fileData  // ArrayBuffer data
  };
  
  // Send processed file object
  const fileDataPayload: FileData = {
    file: fileObject,
    removeExisting: false
  };
  
  this.fileAttached.emit(fileDataPayload);
}

private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
    fileReader.onerror = () => reject(new DOMException('Error reading file'));
    fileReader.readAsArrayBuffer(file);
  });
}
```

### 2. Backend Fix - File Validation

Updated `fileValidation.ts` to handle the new file object format:

```typescript
private validateFileExists(file: any): void {
  if (!file) {
    throw new ControlException('No se ha proporcionado ningún archivo', 400);
  }

  if (!file.name || typeof file.name !== 'string') {
    throw new ControlException('El archivo debe tener un nombre válido', 400);
  }

  // Check for file data in different formats
  const hasData = !!(file.data || file.buffer);
  const hasSize = file.size !== undefined && file.size !== null;
  
  if (!hasData && !hasSize) {
    throw new ControlException('El archivo no contiene datos válidos', 400);
  }
}

private validateFileSize(file: any): void {
  let fileSize = 0;
  
  // Try to get file size from different properties
  if (file.size !== undefined && file.size !== null) {
    fileSize = file.size;
  } else if (file.data && file.data.byteLength !== undefined) {
    fileSize = file.data.byteLength;
  } else if (file.buffer && file.buffer.length !== undefined) {
    fileSize = file.buffer.length;
  }
  
  if (fileSize === 0) {
    throw new ControlException('El archivo está vacío', 400);
  }

  if (fileSize > this.config.maxFileSize) {
    const maxSizeMB = Math.round(this.config.maxFileSize / (1024 * 1024));
    throw new ControlException(`El archivo es demasiado grande. Tamaño máximo permitido: ${maxSizeMB}MB`, 400);
  }
}
```

## How It Works

### Before Fix
1. Frontend: File object sent directly through WebSocket
2. WebSocket: Serializes File object to JSON, losing metadata
3. Backend: Receives Buffer without name, size, etc.
4. Validation: Fails because `file.name` is undefined

### After Fix
1. Frontend: File object converted to plain object with ArrayBuffer data
2. WebSocket: Serializes plain object successfully, preserving all properties
3. Backend: Receives object with name, size, type, and data properties
4. Validation: Succeeds because all required properties are present

## Compatibility

This fix maintains compatibility with the existing `file.bll.ts` infrastructure:
- The processed file object has the same structure as files processed by the existing file upload system
- The `data` property contains the ArrayBuffer that `file.bll.ts` expects
- All file metadata (name, size, type) is preserved for validation and storage

## Testing

After implementing this fix:
1. TypeScript compilation is clean (no errors)
2. File validation should now pass
3. File attachment workflow should complete successfully
4. Files should be properly stored and retrievable

## Files Modified

1. `1_Project/1_Sources/frontend/src/app/components/routes/file-attachment/file-attachment.component.ts`
   - Added `readFileAsArrayBuffer()` method
   - Modified `uploadFile()` to process files before transmission

2. `1_Project/1_Sources/backend/utils/fileValidation.ts`
   - Updated `validateFileExists()` to handle new file format
   - Updated `validateFileSize()` to handle different size properties

3. `1_Project/1_Sources/backend/services/file/file-attachment.bll.ts`
   - Enhanced debug logging to better understand file object structure

## Next Steps

1. Test the complete file attachment workflow
2. Verify file upload, storage, and download functionality
3. Remove debug logging once confirmed working
4. Update documentation if needed