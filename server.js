const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
    connectionString: 'postgresql://postgres.fejrfxeqcxgytwyiolea:%40G1hh4ej22d@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

// Rota: Listar itens e calcular resumo do mês
app.get('/api/itens', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM produtos_casa ORDER BY data_compra DESC');
        const data = result.rows;

        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();

        let totalMes = 0;
        data.forEach(item => {
            const dataItem = new Date(item.data_compra);
            if (dataItem.getMonth() === mesAtual && dataItem.getFullYear() === anoAtual) {
                totalMes += Number(item.valor_total || 0);
            }
        });

        res.json({ itens: data, totalMes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rota: Adicionar item comprado no mercado
app.post('/api/itens', async (req, res) => {
    try {
        const { nome, categoria, quantidade, preco_unitario } = req.body;
        const valor_total = Number(quantidade) * Number(preco_unitario);

        const query = `
            INSERT INTO produtos_casa (nome, categoria, quantidade, preco_unitario, valor_total) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const values = [nome, categoria, quantidade, preco_unitario, valor_total];
        const result = await pool.query(query, values);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rota: Deletar item do estoque
app.delete('/api/itens/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM produtos_casa WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});