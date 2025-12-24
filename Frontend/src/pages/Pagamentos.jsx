import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Pagamentos.module.css';

const API_URL = import.meta.env.VITE_API_URL;

export function Pagamentos() {
  const { cpf } = useParams();
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOrcamento, setFormOrcamento] = useState({
    data_orcamento: new Date().toISOString().split('T')[0],
    preco: '',
    descricao: '',
  });
  const [formPagamento, setFormPagamento] = useState({});

  useEffect(() => {
    fetchOrcamentos();
  }, [cpf]);

  const fetchOrcamentos = async () => {
    try {
      const response = await fetch(`${API_URL}/paciente/${cpf}/orcamentos`);
      if (response.ok) {
        const data = await response.json();
        setOrcamentos(data);
      } else {
        const errorData = await response.json();
        console.error('Erro ao buscar orçamentos:', errorData.error || 'Erro desconhecido');
        if (response.status === 404) {
          alert(errorData.error || 'Paciente não encontrado.');
          navigate(`/ficha/${cpf}`);
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao buscar orçamentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrcamentoChange = (e) => {
    const { name, value } = e.target;
    setFormOrcamento((prev) => ({ ...prev, [name]: value }));
  };

  const handlePagamentoChange = (orcamentoId, field, value) => {
    setFormPagamento((prev) => ({
      ...prev,
      [orcamentoId]: {
        data_pagamento: prev[orcamentoId]?.data_pagamento || new Date().toISOString().split('T')[0],
        valor_parcela: prev[orcamentoId]?.valor_parcela || '',
        meio_pagamento: prev[orcamentoId]?.meio_pagamento || '',
        [field]: value,
      },
    }));
  };

  const handleAddOrcamento = async () => {
    if (!formOrcamento.data_orcamento || !formOrcamento.preco) {
      alert('Por favor, preencha a data e o preço.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/paciente/${cpf}/orcamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formOrcamento),
      });
      if (response.ok) {
        setFormOrcamento({
          data_orcamento: new Date().toISOString().split('T')[0],
          preco: '',
          descricao: '',
        });
        fetchOrcamentos();
      } else {
        const errorData = await response.json();
        alert(`Erro ao adicionar orçamento: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao adicionar orçamento. Tente novamente.');
    }
  };

  const handleAddPagamento = async (orcamentoId) => {
    const pagamento = formPagamento[orcamentoId];
    const data_pagamento = pagamento?.data_pagamento || new Date().toISOString().split('T')[0];
    const valor_parcela = pagamento?.valor_parcela;
    
    if (!valor_parcela || valor_parcela === '' || parseFloat(valor_parcela) <= 0) {
      alert('Por favor, preencha o valor do pagamento.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/orcamentos/${orcamentoId}/pagamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_pagamento: data_pagamento,
          valor_parcela: parseFloat(valor_parcela),
          meio_pagamento: pagamento?.meio_pagamento || '',
        }),
      });
      if (response.ok) {
        setFormPagamento((prev) => ({
          ...prev,
          [orcamentoId]: {
            data_pagamento: new Date().toISOString().split('T')[0],
            valor_parcela: '',
            meio_pagamento: '',
          },
        }));
        fetchOrcamentos();
      } else {
        const errorData = await response.json();
        alert(`Erro ao adicionar pagamento: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao adicionar pagamento. Tente novamente.');
    }
  };

  const handleEditOrcamento = (index) => {
    setOrcamentos((prev) =>
      prev.map((o, i) =>
        i === index ? { ...o, isEditing: !o.isEditing } : o
      )
    );
  };

  const handleSaveOrcamento = async (index) => {
    const orcamento = orcamentos[index];
    if (!orcamento.data_orcamento || !orcamento.preco) {
      alert('Data e preço são obrigatórios.');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/paciente/${cpf}/orcamentos/${orcamento.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data_orcamento: orcamento.data_orcamento,
            preco: orcamento.preco,
            descricao: orcamento.descricao || '',
          }),
        }
      );

      if (response.ok) {
        fetchOrcamentos();
      } else {
        const errorData = await response.json();
        alert(`Erro ao salvar orçamento: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar orçamento. Tente novamente.');
    }
  };

  const handleOrcamentoFieldChange = (index, field, value) => {
    setOrcamentos((prev) =>
      prev.map((o, i) =>
        i === index ? { ...o, [field]: value } : o
      )
    );
  };

  const handleDeleteOrcamento = async (index) => {
    const orcamento = orcamentos[index];
    if (!window.confirm('Tem certeza que deseja excluir este orçamento? Todos os pagamentos relacionados também serão excluídos.')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/paciente/${cpf}/orcamentos/${orcamento.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchOrcamentos();
      } else {
        const errorData = await response.json();
        alert(`Erro ao deletar orçamento: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao deletar orçamento. Tente novamente.');
    }
  };

  const handleEditPagamento = (orcamentoIndex, pagamentoIndex) => {
    setOrcamentos((prev) =>
      prev.map((o, oIdx) => {
        if (oIdx !== orcamentoIndex) return o;
        return {
          ...o,
          pagamentos: o.pagamentos.map((p, pIdx) =>
            pIdx === pagamentoIndex ? { ...p, isEditing: !p.isEditing } : p
          ),
        };
      })
    );
  };

  const handleSavePagamento = async (orcamentoIndex, pagamentoIndex) => {
    const orcamento = orcamentos[orcamentoIndex];
    const pagamento = orcamento.pagamentos[pagamentoIndex];
    if (!pagamento.data_pagamento || !pagamento.valor_parcela) {
      alert('Data e valor são obrigatórios.');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/orcamentos/${orcamento.id}/pagamentos/${pagamento.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data_pagamento: pagamento.data_pagamento,
            valor_parcela: pagamento.valor_parcela,
            meio_pagamento: pagamento.meio_pagamento || '',
          }),
        }
      );

      if (response.ok) {
        fetchOrcamentos();
      } else {
        const errorData = await response.json();
        alert(`Erro ao salvar pagamento: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar pagamento. Tente novamente.');
    }
  };

  const handlePagamentoFieldChange = (orcamentoIndex, pagamentoIndex, field, value) => {
    setOrcamentos((prev) =>
      prev.map((o, oIdx) => {
        if (oIdx !== orcamentoIndex) return o;
        return {
          ...o,
          pagamentos: o.pagamentos.map((p, pIdx) =>
            pIdx === pagamentoIndex ? { ...p, [field]: value } : p
          ),
        };
      })
    );
  };

  const handleDeletePagamento = async (orcamentoIndex, pagamentoIndex) => {
    const orcamento = orcamentos[orcamentoIndex];
    const pagamento = orcamento.pagamentos[pagamentoIndex];
    if (!window.confirm('Tem certeza que deseja excluir este pagamento?')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/orcamentos/${orcamento.id}/pagamentos/${pagamento.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchOrcamentos();
      } else {
        const errorData = await response.json();
        alert(`Erro ao deletar pagamento: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao deletar pagamento. Tente novamente.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const isoString = date.toISOString().split('T')[0];
    const [year, month, day] = isoString.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '0,00';
    return parseFloat(value).toFixed(2).replace('.', ',');
  };

  if (loading) return <div className={styles.container}><p>Carregando...</p></div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Orçamentos e Pagamentos</h1>
      <button className={styles.backButton} onClick={() => navigate(`/ficha/${cpf}`)}>
        Voltar para Ficha
      </button>

      {/* Formulário para adicionar novo orçamento */}
      <div className={styles.novoOrcamento}>
        <h2 className={styles.subtitle}>Novo Orçamento</h2>
        <div className={styles.formRow}>
          <input
            type="date"
            name="data_orcamento"
            value={formOrcamento.data_orcamento}
            onChange={handleOrcamentoChange}
            className={styles.input}
          />
          <input
            type="number"
            name="preco"
            value={formOrcamento.preco}
            onChange={handleOrcamentoChange}
            placeholder="Preço (R$)"
            step="0.01"
            min="0"
            className={styles.input}
          />
          <input
            type="text"
            name="descricao"
            value={formOrcamento.descricao}
            onChange={handleOrcamentoChange}
            placeholder="Descrição do orçamento"
            className={styles.input}
          />
          <button className={styles.addButton} onClick={handleAddOrcamento}>
            Adicionar Orçamento
          </button>
        </div>
      </div>

      {/* Lista de orçamentos */}
      <div className={styles.orcamentos}>
        <h2 className={styles.subtitle}>Orçamentos</h2>
        {orcamentos.map((orcamento, oIdx) => {
          const totalPago = orcamento.pagamentos.reduce((sum, p) => sum + parseFloat(p.valor_parcela || 0), 0);
          const faltaPagar = Math.max(0, parseFloat(orcamento.preco) - totalPago);

          return (
            <div key={orcamento.id} className={styles.orcamentoCard}>
              {/* Linha do Orçamento */}
              <div className={styles.orcamentoRow}>
                <table className={styles.orcamentoTable}>
                  <thead>
                    <tr className={styles.tableHeader}>
                      <th>Data</th>
                      <th>Preço</th>
                      <th>Descrição</th>
                      <th>Total Pago</th>
                      <th>Falta Pagar</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {orcamento.isEditing ? (
                          <input
                            type="date"
                            value={orcamento.data_orcamento}
                            onChange={(e) => handleOrcamentoFieldChange(oIdx, 'data_orcamento', e.target.value)}
                            className={styles.inputInline}
                          />
                        ) : (
                          formatDate(orcamento.data_orcamento)
                        )}
                      </td>
                      <td>
                        {orcamento.isEditing ? (
                          <input
                            type="number"
                            value={orcamento.preco}
                            onChange={(e) => handleOrcamentoFieldChange(oIdx, 'preco', e.target.value)}
                            step="0.01"
                            min="0"
                            className={styles.inputInline}
                          />
                        ) : (
                          `R$ ${formatCurrency(orcamento.preco)}`
                        )}
                      </td>
                      <td>
                        {orcamento.isEditing ? (
                          <input
                            type="text"
                            value={orcamento.descricao || ''}
                            onChange={(e) => handleOrcamentoFieldChange(oIdx, 'descricao', e.target.value)}
                            className={styles.inputInline}
                          />
                        ) : (
                          orcamento.descricao || '-'
                        )}
                      </td>
                      <td className={styles.valorPago}>R$ {formatCurrency(totalPago)}</td>
                      <td className={faltaPagar > 0 ? styles.valorPendente : styles.valorPago}>
                        R$ {formatCurrency(faltaPagar)}
                      </td>
                      <td>
                        {orcamento.isEditing ? (
                          <button
                            className={styles.addButton}
                            onClick={() => handleSaveOrcamento(oIdx)}
                          >
                            Salvar
                          </button>
                        ) : (
                          <>
                            <button
                              className={styles.addButton}
                              onClick={() => handleEditOrcamento(oIdx)}
                            >
                              Editar
                            </button>
                            <button
                              className={styles.addButton}
                              onClick={() => handleDeleteOrcamento(oIdx)}
                            >
                              Excluir
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pagamentos do Orçamento */}
              <div className={styles.pagamentosSection}>
                <h3 className={styles.pagamentosTitle}>Pagamentos</h3>
                <table className={styles.pagamentoTable}>
                  <thead>
                    <tr className={styles.tableHeader}>
                      <th>Data do Pagamento</th>
                      <th>Valor Pago</th>
                      <th>Forma de Pagamento</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Linha para adicionar novo pagamento */}
                    <tr className={styles.newPagamentoRow}>
                      <td>
                        <input
                          type="date"
                          value={formPagamento[orcamento.id]?.data_pagamento || new Date().toISOString().split('T')[0]}
                          onChange={(e) => handlePagamentoChange(orcamento.id, 'data_pagamento', e.target.value)}
                          className={styles.inputInline}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={formPagamento[orcamento.id]?.valor_parcela || ''}
                          onChange={(e) => handlePagamentoChange(orcamento.id, 'valor_parcela', e.target.value)}
                          placeholder="0,00"
                          step="0.01"
                          min="0"
                          className={styles.inputInline}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={formPagamento[orcamento.id]?.meio_pagamento || ''}
                          onChange={(e) => handlePagamentoChange(orcamento.id, 'meio_pagamento', e.target.value)}
                          placeholder="Ex: Dinheiro, Cartão, PIX..."
                          className={styles.inputInline}
                        />
                      </td>
                      <td>
                        <button
                          className={styles.addButton}
                          onClick={() => handleAddPagamento(orcamento.id)}
                        >
                          Adicionar
                        </button>
                      </td>
                    </tr>
                    {/* Linhas dos pagamentos existentes */}
                    {orcamento.pagamentos.map((pagamento, pIdx) => (
                      <tr key={pagamento.id} className={styles.pagamentoRow}>
                        <td>
                          {pagamento.isEditing ? (
                            <input
                              type="date"
                              value={pagamento.data_pagamento}
                              onChange={(e) => handlePagamentoFieldChange(oIdx, pIdx, 'data_pagamento', e.target.value)}
                              className={styles.inputInline}
                            />
                          ) : (
                            formatDate(pagamento.data_pagamento)
                          )}
                        </td>
                        <td>
                          {pagamento.isEditing ? (
                            <input
                              type="number"
                              value={pagamento.valor_parcela}
                              onChange={(e) => handlePagamentoFieldChange(oIdx, pIdx, 'valor_parcela', e.target.value)}
                              step="0.01"
                              min="0"
                              className={styles.inputInline}
                            />
                          ) : (
                            `R$ ${formatCurrency(pagamento.valor_parcela)}`
                          )}
                        </td>
                        <td>
                          {pagamento.isEditing ? (
                            <input
                              type="text"
                              value={pagamento.meio_pagamento || ''}
                              onChange={(e) => handlePagamentoFieldChange(oIdx, pIdx, 'meio_pagamento', e.target.value)}
                              placeholder="Ex: Dinheiro, Cartão, PIX..."
                              className={styles.inputInline}
                            />
                          ) : (
                            pagamento.meio_pagamento || '-'
                          )}
                        </td>
                        <td>
                          {pagamento.isEditing ? (
                            <button
                              className={styles.addButton}
                              onClick={() => handleSavePagamento(oIdx, pIdx)}
                            >
                              Salvar
                            </button>
                          ) : (
                            <>
                              <button
                                className={styles.addButton}
                                onClick={() => handleEditPagamento(oIdx, pIdx)}
                              >
                                Editar
                              </button>
                              <button
                                className={styles.addButton}
                                onClick={() => handleDeletePagamento(oIdx, pIdx)}
                              >
                                Excluir
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Pagamentos;

