import { z } from 'zod'

export const uploadFileSchema = z.object({
  // Use multer for multipart/form-data, so validation é feita no controller
  // Aqui só exemplo para outros campos do body se necessário
})

export const fileIdParamSchema = z.object({
  id: z.string().min(1)
})
