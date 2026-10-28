
import express, { type Request, type Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

interface DadosTarefa {
  titulo: string;
  descricao?: string;
  concluida: boolean;
}

interface AtualizarTarefa {
  titulo?: string;
  descricao?: string;
  concluida?: boolean;
}

interface ParametrosTarefa {
  id: string;
}

interface FiltrosTarefa {
  titulo?: string;
  concluida?: string;
}

// POST - Criar tarefa

app.post('/tarefas', async (req, res) => {
  try {
    const { titulo, descricao, concluida } = req.body;

    if (typeof titulo !== 'string' || titulo.trim() === '') {
      return res.status(400).json({
        erro: 'O título não deve estar vazio.'
      });
    }

    if (descricao !== undefined &&
        (typeof descricao !== 'string' || descricao.trim() === '')) {
      return res.status(400).json({
        erro: 'A descrição deve ser um texto não vazio.'
      });
    }

    if (concluida !== undefined && typeof concluida !== 'boolean') {
      return res.status(400).json({
        erro: 'O campo concluida deve ser true ou false.'
      });
    }

    const dados: DadosTarefa = {
      titulo: titulo.trim(),
      descricao: descricao?.trim(),
      concluida: concluida ?? false
    };

    const novaTarefa = await prisma.tarefa.create({
      data: dados
    });

    return res.status(201).json(novaTarefa);

  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({
      erro: 'Erro ao criar a tarefa.'
    });
  }
});


// GET - Listar e filtrar tarefas
app.get('/tarefas', async (req: Request<{}, {}, {}, FiltrosTarefa>,res: Response) => {
    try {
      const { titulo, concluida } = req.query;

      if (
        concluida !== undefined &&
        concluida !== 'true' &&
        concluida !== 'false'
      ) {
        return res.status(400).json({
          erro: 'O filtro concluida deve ser true ou false.'
        });
      }

      const tarefas = await prisma.tarefa.findMany({
        where: {
          titulo: titulo?.trim()
            ? {
                contains: titulo.trim(),
                mode: 'insensitive'
              }
            : undefined,

          concluida: concluida !== undefined
            ? concluida === 'true'
            : undefined
        }
      });

      return res.status(200).json(tarefas);

    } catch (error: unknown) {
      console.error(error);

      return res.status(500).json({
        erro: 'Erro ao buscar tarefas.'
      });
    }
  }
);

// PUT - Atualizar tarefa

app.put('/tarefas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, concluida } = req.body;

    if (
      titulo === undefined &&
      descricao === undefined &&
      concluida === undefined
    ) {
      return res.status(400).json({
        erro: 'Informe pelo menos um campo para atualizar.'
      });
    }

    if (
      titulo !== undefined &&
      (typeof titulo !== 'string' || titulo.trim() === '')
    ) {
      return res.status(400).json({
        erro: 'O título deve ser um texto não vazio.'
      });
    }

    if (
      descricao !== undefined &&
      (typeof descricao !== 'string' || descricao.trim() === '')
    ) {
      return res.status(400).json({
        erro: 'A descrição deve ser um texto não vazio.'
      });
    }

    if (
      concluida !== undefined &&
      typeof concluida !== 'boolean'
    ) {
      return res.status(400).json({
        erro: 'O campo concluida deve ser true ou false.'
      });
    }

    const dados: AtualizarTarefa = {};

    if (typeof titulo === 'string') {
      dados.titulo = titulo.trim();
    }

    if (typeof descricao === 'string') {
      dados.descricao = descricao.trim();
    }

    if (typeof concluida === 'boolean') {
      dados.concluida = concluida;
    }

    const tarefaAtualizada = await prisma.tarefa.update({
      where: { id },
      data: dados
    });

    return res.status(200).json(tarefaAtualizada);

  } catch (error: unknown) {
    console.error(error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({
        erro: 'Tarefa não encontrada.'
      });
    }

    return res.status(500).json({
      erro: 'Erro ao atualizar a tarefa.'
    });
  }
});


// DELETE - Excluir tarefa
app.delete('/tarefas/:id',async (req: Request<ParametrosTarefa>, res: Response) => {
    try {
      const { id } = req.params;

      const tarefaDeletada = await prisma.tarefa.delete({
        where: { id }
      });

      return res.status(200).json(tarefaDeletada);

    } catch (error: unknown) {
      console.error(error);

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return res.status(404).json({
          erro: 'Tarefa não encontrada para deletar.'
        });
      }

      return res.status(500).json({
        erro: 'Erro ao deletar tarefa.'
      });
    }
  }
);

const PORT: number = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}!`);
});
