import express from 'express';
import cors from 'cors';
import si from 'systeminformation';

const app = express();
const PORT = 3333;

// Enable CORS for your web app domain
app.use(cors());

// Endpoint to get GPU stats
app.get('/gpu-stats', async (req, res) => {
  try {
    const gpuData = await si.graphics();
    
    if (gpuData.controllers && gpuData.controllers.length > 0) {
      const controller = gpuData.controllers[0];
      res.json({
        temp: controller.temperatureGpu ?? 0,
        usage: controller.utilizationMemory ?? 0,
        model: controller.model,
        memory: {
          total: controller.memoryTotal,
          used: controller.memoryUsed,
          free: controller.memoryFree
        }
      });
    } else {
      res.json({
        temp: 0,
        usage: 0,
        error: "No GPU controllers found"
      });
    }
  } catch (error) {
    console.error("Error getting GPU stats:", error);
    res.status(500).json({
      error: "Failed to get GPU stats",
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`GPU monitoring server running on port ${PORT}`);
});