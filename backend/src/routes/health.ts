import { Router } from 'express'
import * as controller from '../controllers/healthController'

const router = Router()

router.get('/', controller.health)

export default router
