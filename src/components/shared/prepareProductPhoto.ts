// Keep demo photos compact enough for the existing localStorage-backed imageUrl.
export async function prepareProductPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Vui lòng chọn ảnh JPG, PNG hoặc WebP.');
  }
  if (file.size > 8 * 1024 * 1024) throw new Error('Ảnh vượt quá 8 MB. Vui lòng chọn ảnh nhỏ hơn.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Không đọc được ảnh. Vui lòng chọn ảnh khác.');
  }
  try {
    const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL('image/jpeg', 0.78);
    if (!result.startsWith('data:image/jpeg') || result.length > 450_000) {
      throw new Error('Ảnh có quá nhiều chi tiết để lưu demo. Vui lòng chọn ảnh nhỏ hơn.');
    }
    return result;
  } finally {
    bitmap.close();
  }
}
