import { addVote, checkIfVoted } from '@/services/firebaseService';

const TOTAL_VOTERS = 500;
const CONCURRENT_VOTES = 50; // Número de votos simultáneos
const DELAY_BETWEEN_BATCHES = 1000; // 1 segundo entre lotes

async function simulateVote(voterId: string) {
  try {
    const hasVoted = await checkIfVoted(voterId);
    if (!hasVoted) {
      const vote = {
        id: voterId,
        vote: Math.random() > 0.5 ? 'yes' : 'no', // Voto aleatorio
        weight: 1, // O el peso que corresponda a cada votante
      };

      await addVote(vote);
      console.log(`✅ Voto registrado para ${voterId}`);
    } else {
      console.log(`⚠️ El votante ${voterId} ya había votado`);
    }
  } catch (error) {
    console.error(`❌ Error al procesar voto para ${voterId}:`, error);
  }
}

async function runStressTest() {
  console.log('Iniciando prueba de estrés...');
  const startTime = Date.now();

  for (let i = 1; i <= TOTAL_VOTERS; i += CONCURRENT_VOTES) {
    const batch: Promise<void>[] = [];
    for (let j = 0; j < CONCURRENT_VOTES && i + j <= TOTAL_VOTERS; j++) {
      const voterId = `B${String(i + j).padStart(3, '0')}`;
      batch.push(simulateVote(voterId));
    }

    await Promise.all(batch);
    console.log(`Procesado lote de ${batch.length} votos`);

    if (i + CONCURRENT_VOTES <= TOTAL_VOTERS) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  console.log(`\nPrueba completada en ${totalTime} segundos`);
}

// Ejecutar la prueba
runStressTest().catch(console.error);
