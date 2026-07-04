import { Router } from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from '../controllers/taskController';
import {
  completeTask,
  approveTask,
  rejectTask,
} from '../controllers/taskCompletionController';

const router = Router();

// 1. All routes require login
router.use(protect);

// Body-shape validation for task creation. Belt-and-suspenders alongside the
// controller's own check — fails fast with a clearer 400 before any DB work.
const createTaskValidator = validateRequest({
  body: {
    title: { required: true, type: 'string' },
    pointsValue: { required: true, type: 'number' },
    assignedTo: {
      required: true,
      type: 'array',
      custom: (val: unknown) =>
        Array.isArray(val) && val.length > 0
          ? { valid: true }
          : { valid: false, message: 'assignedTo must be a non-empty array of member IDs' },
    },
    description: { type: 'string' },
  },
});

// 2. Public Routes (Parent & Child)
// Everyone needs to see tasks to know what to do!
router.route('/')
  .get(getAllTasks)
  .post(restrictTo('Parent'), createTaskValidator, createTask); // Only Parents create tasks

router.post('/:id/complete', completeTask); // Anyone can complete

// 3. Restricted Routes (Parent Only)
router.post('/:id/approve', restrictTo('Parent'), approveTask);
router.post('/:id/reject', restrictTo('Parent'), rejectTask);

router
  .route('/:id')
  .get(getTaskById) // Anyone can view details
  .patch(restrictTo('Parent'), updateTask)
  .delete(restrictTo('Parent'), deleteTask);

export default router;