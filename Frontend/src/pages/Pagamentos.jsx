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
    itens: [{ data_item: new Date().toISOString().split('T')[0], preco: '', descricao: '' }]
  });
  const [formPagamento, setFormPagamento] = useState({});
  const [formItem, setFormItem] = useState({});

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

  const handleItemFormChange = (index, field, value) => {
    setFormOrcamento((prev) => ({
      ...prev,
      itens: prev.itens.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItemToForm = () => {
    setFormOrcamento((prev) => ({
      ...prev,
      itens: [...prev.itens, { data_item: prev.data_orcamento, preco: '', descricao: '' }]
    }));
  };

  const removeItemFromForm = (index) => {
    setFormOrcamento((prev) => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  const handleAddOrcamento = async () => {
    if (!formOrcamento.data_orcamento) {
      alert('Por favor, preencha a data do orçamento.');
      return;
    }
    if (!formOrcamento.itens || formOrcamento.itens.length === 0) {
      alert('Por favor, adicione pelo menos um item ao orçamento.');
      return;
    }
    if (formOrcamento.itens.some(item => !item.preco || parseFloat(item.preco) <= 0)) {
      alert('Todos os itens devem ter um preço válido.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/paciente/${cpf}/orcamentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_orcamento: formOrcamento.data_orcamento,
          itens: formOrcamento.itens.map(item => ({
            data_item: item.data_item || formOrcamento.data_orcamento,
            preco: parseFloat(item.preco),
            descricao: item.descricao || ''
          }))
        }),
      });
      if (response.ok) {
        setFormOrcamento({
          data_orcamento: new Date().toISOString().split('T')[0],
          itens: [{ data_item: new Date().toISOString().split('T')[0], preco: '', descricao: '' }]
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

  const handleAddItem = async (orcamentoId) => {
    const item = formItem[orcamentoId];
    if (!item || !item.preco || parseFloat(item.preco) <= 0) {
      alert('Por favor, preencha o preço do item.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/orcamentos/${orcamentoId}/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_item: item.data_item || new Date().toISOString().split('T')[0],
          preco: parseFloat(item.preco),
          descricao: item.descricao || ''
        }),
      });
      if (response.ok) {
        setFormItem((prev) => ({
          ...prev,
          [orcamentoId]: { data_item: new Date().toISOString().split('T')[0], preco: '', descricao: '' }
        }));
        fetchOrcamentos();
      } else {
        const errorData = await response.json();
        alert(`Erro ao adicionar item: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao adicionar item. Tente novamente.');
    }
  };

  const handleItemChange = (orcamentoId, field, value) => {
    setFormItem((prev) => ({
      ...prev,
      [orcamentoId]: {
        data_item: prev[orcamentoId]?.data_item || new Date().toISOString().split('T')[0],
        preco: prev[orcamentoId]?.preco || '',
        descricao: prev[orcamentoId]?.descricao || '',
        [field]: value,
      },
    }));
  };

  const handleEditItem = (orcamentoIndex, itemIndex) => {
    setOrcamentos((prev) =>
      prev.map((o, oIdx) => {
        if (oIdx !== orcamentoIndex) return o;
        return {
          ...o,
          itens: o.itens.map((item, iIdx) =>
            iIdx === itemIndex ? { ...item, isEditing: !item.isEditing } : item
          ),
        };
      })
    );
  };

  const handleSaveItem = async (orcamentoIndex, itemIndex) => {
    const orcamento = orcamentos[orcamentoIndex];
    const item = orcamento.itens[itemIndex];
    if (!item.data_item || !item.preco) {
      alert('Data e preço são obrigatórios.');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/orcamentos/${orcamento.id}/itens/${item.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data_item: item.data_item,
            preco: parseFloat(item.preco),
            descricao: item.descricao || '',
          }),
        }
      );

      if (response.ok) {
        fetchOrcamentos();
      } else {
        const errorData = await response.json();
        alert(`Erro ao salvar item: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar item. Tente novamente.');
    }
  };

  const handleItemFieldChange = (orcamentoIndex, itemIndex, field, value) => {
    setOrcamentos((prev) =>
      prev.map((o, oIdx) => {
        if (oIdx !== orcamentoIndex) return o;
        return {
          ...o,
          itens: o.itens.map((item, iIdx) =>
            iIdx === itemIndex ? { ...item, [field]: value } : item
          ),
        };
      })
    );
  };

  const handleDeleteItem = async (orcamentoIndex, itemIndex) => {
    const orcamento = orcamentos[orcamentoIndex];
    const item = orcamento.itens[itemIndex];
    if (!window.confirm('Tem certeza que deseja excluir este item?')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/orcamentos/${orcamento.id}/itens/${item.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchOrcamentos();
      } else {
        const errorData = await response.json();
        alert(`Erro ao deletar item: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao deletar item. Tente novamente.');
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
    if (!orcamento.data_orcamento) {
      alert('Data do orçamento é obrigatória.');
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
    if (!window.confirm('Tem certeza que deseja excluir este orçamento? Todos os itens e pagamentos relacionados também serão excluídos.')) {
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
    if (!dateString) return '-';
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
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Orçamentos e Pagamentos</h1>
        <button className={styles.backButton} onClick={() => navigate(`/ficha/${cpf}`)}>
          Voltar
        </button>
      </div>

      {/* Formulário para adicionar novo orçamento com múltiplos itens */}
      <div className={styles.formSection}>
        <div className={styles.formHeader}>
          <h3>Novo Orçamento</h3>
          <input
            type="date"
            name="data_orcamento"
            value={formOrcamento.data_orcamento}
            onChange={handleOrcamentoChange}
            className={styles.formInput}
          />
        </div>
        <div className={styles.itemsForm}>
          {formOrcamento.itens.map((item, index) => (
            <div key={index} className={styles.itemFormRow}>
              <input
                type="date"
                value={item.data_item}
                onChange={(e) => handleItemFormChange(index, 'data_item', e.target.value)}
                className={styles.formInput}
              />
              <input
                type="number"
                value={item.preco}
                onChange={(e) => handleItemFormChange(index, 'preco', e.target.value)}
                placeholder="Preço"
                step="0.01"
                min="0"
                className={styles.formInput}
              />
              <input
                type="text"
                value={item.descricao}
                onChange={(e) => handleItemFormChange(index, 'descricao', e.target.value)}
                placeholder="Descrição"
                className={styles.formInput}
              />
              {formOrcamento.itens.length > 1 && (
                <button
                  className={styles.removeButton}
                  onClick={() => removeItemFromForm(index)}
                  title="Remover item"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <div className={styles.formActions}>
            <button className={styles.smallButton} onClick={addItemToForm}>
              + Item
            </button>
            <button className={styles.smallButton} onClick={handleAddOrcamento}>
              Criar Orçamento
            </button>
          </div>
        </div>
      </div>

      {/* Tabela única estilo Excel */}
      <div className={styles.tableWrapper}>
        <table className={styles.excelTable}>
          <tbody>
            {orcamentos.map((orcamento, oIdx) => {
              const totalOrcamento = orcamento.total || 0;
              const totalPago = orcamento.pagamentos.reduce((sum, p) => sum + parseFloat(p.valor_parcela || 0), 0);
              const faltaPagar = Math.max(0, totalOrcamento - totalPago);

              return (
                <React.Fragment key={orcamento.id}>
                  {/* Cabeçalho do Orçamento */}
                  <tr className={styles.orcamentoHeaderRow}>
                    <td colSpan="5">
                      <div className={styles.orcamentoHeader}>
                        <strong>ORÇAMENTO #{orcamento.id}</strong>
                        <span className={styles.orcamentoDate}>
                          {orcamento.isEditing ? (
                            <input
                              type="date"
                              value={orcamento.data_orcamento}
                              onChange={(e) => handleOrcamentoFieldChange(oIdx, 'data_orcamento', e.target.value)}
                              className={styles.cellInput}
                            />
                          ) : (
                            formatDate(orcamento.data_orcamento)
                          )}
                        </span>
                        <div className={styles.orcamentoActions}>
                          {orcamento.isEditing ? (
                            <button
                              className={styles.iconButton}
                              onClick={() => handleSaveOrcamento(oIdx)}
                              title="Salvar"
                            >
                              ✓
                            </button>
                          ) : (
                            <>
                              <button
                                className={styles.iconButton}
                                onClick={() => handleEditOrcamento(oIdx)}
                                title="Editar"
                              >
                                ✎
                              </button>
                              <button
                                className={styles.iconButton}
                                onClick={() => handleDeleteOrcamento(oIdx)}
                                title="Excluir"
                              >
                                ×
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Itens do Orçamento */}
                  {orcamento.itens && orcamento.itens.map((item, iIdx) => (
                    <tr key={item.id} className={styles.itemRow}>
                      <td className={styles.colDate}>
                        {item.isEditing ? (
                          <input
                            type="date"
                            value={item.data_item}
                            onChange={(e) => handleItemFieldChange(oIdx, iIdx, 'data_item', e.target.value)}
                            className={styles.cellInput}
                          />
                        ) : (
                          formatDate(item.data_item)
                        )}
                      </td>
                      <td className={styles.colDesc}>
                        {item.isEditing ? (
                          <input
                            type="text"
                            value={item.descricao || ''}
                            onChange={(e) => handleItemFieldChange(oIdx, iIdx, 'descricao', e.target.value)}
                            className={styles.cellInput}
                          />
                        ) : (
                          item.descricao || '-'
                        )}
                      </td>
                      <td className={`${styles.colValue} ${styles.valueCell}`}>
                        {item.isEditing ? (
                          <input
                            type="number"
                            value={item.preco}
                            onChange={(e) => handleItemFieldChange(oIdx, iIdx, 'preco', e.target.value)}
                            step="0.01"
                            min="0"
                            className={styles.cellInput}
                          />
                        ) : (
                          `R$ ${formatCurrency(item.preco)}`
                        )}
                      </td>
                      <td className={styles.colPayment}>-</td>
                      <td className={styles.colActions}>
                        {item.isEditing ? (
                          <button
                            className={styles.iconButton}
                            onClick={() => handleSaveItem(oIdx, iIdx)}
                            title="Salvar"
                          >
                            ✓
                          </button>
                        ) : (
                          <>
                            <button
                              className={styles.iconButton}
                              onClick={() => handleEditItem(oIdx, iIdx)}
                              title="Editar"
                            >
                              ✎
                            </button>
                            <button
                              className={styles.iconButton}
                              onClick={() => handleDeleteItem(oIdx, iIdx)}
                              title="Excluir"
                            >
                              ×
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Linha para adicionar novo item */}
                  <tr className={styles.newItemRow}>
                    <td className={styles.colDate}>
                      <input
                        type="date"
                        value={formItem[orcamento.id]?.data_item || new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleItemChange(orcamento.id, 'data_item', e.target.value)}
                        className={styles.cellInput}
                      />
                    </td>
                    <td className={styles.colDesc}>
                      <input
                        type="text"
                        value={formItem[orcamento.id]?.descricao || ''}
                        onChange={(e) => handleItemChange(orcamento.id, 'descricao', e.target.value)}
                        placeholder="Descrição"
                        className={styles.cellInput}
                      />
                    </td>
                    <td className={styles.colValue}>
                      <input
                        type="number"
                        value={formItem[orcamento.id]?.preco || ''}
                        onChange={(e) => handleItemChange(orcamento.id, 'preco', e.target.value)}
                        placeholder="0,00"
                        step="0.01"
                        min="0"
                        className={styles.cellInput}
                      />
                    </td>
                    <td className={styles.colPayment}>-</td>
                    <td className={styles.colActions}>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleAddItem(orcamento.id)}
                        title="Adicionar"
                      >
                        +
                      </button>
                    </td>
                  </tr>

                  {/* Linha de totais */}
                  <tr className={styles.totalsRow}>
                    <td colSpan="2">
                      <strong>TOTAIS</strong>
                    </td>
                    <td className={`${styles.colValue} ${styles.valueCell} ${styles.totalValue}`}>
                      <strong>R$ {formatCurrency(totalOrcamento)}</strong>
                    </td>
                    <td className={styles.colPayment}>-</td>
                    <td className={styles.colActions}>-</td>
                  </tr>
                  <tr className={styles.summaryRow}>
                    <td colSpan="2">
                      <span className={styles.summaryLabel}>Valor Pago:</span>
                      <span className={styles.valorPago}>R$ {formatCurrency(totalPago)}</span>
                    </td>
                    <td className={styles.colValue}>
                      <span className={styles.summaryLabel}>Resta Pagar:</span>
                      <span className={faltaPagar > 0 ? styles.valorPendente : styles.valorPago}>
                        R$ {formatCurrency(faltaPagar)}
                      </span>
                    </td>
                    <td className={styles.colPayment}>-</td>
                    <td className={styles.colActions}>-</td>
                  </tr>

                  {/* Cabeçalho da seção de pagamentos */}
                  <tr className={styles.pagamentosHeaderRow}>
                    <td colSpan="5">
                      <strong>PAGAMENTOS</strong>
                    </td>
                  </tr>

                  {/* Pagamentos do Orçamento */}
                  {orcamento.pagamentos && orcamento.pagamentos.map((pagamento, pIdx) => (
                    <tr key={pagamento.id} className={styles.pagamentoRow}>
                      <td className={styles.colDate}>
                        {pagamento.isEditing ? (
                          <input
                            type="date"
                            value={pagamento.data_pagamento}
                            onChange={(e) => handlePagamentoFieldChange(oIdx, pIdx, 'data_pagamento', e.target.value)}
                            className={styles.cellInput}
                          />
                        ) : (
                          formatDate(pagamento.data_pagamento)
                        )}
                      </td>
                      <td className={styles.colDesc}>-</td>
                      <td className={`${styles.colValue} ${styles.valueCell}`}>
                        {pagamento.isEditing ? (
                          <input
                            type="number"
                            value={pagamento.valor_parcela}
                            onChange={(e) => handlePagamentoFieldChange(oIdx, pIdx, 'valor_parcela', e.target.value)}
                            step="0.01"
                            min="0"
                            className={styles.cellInput}
                          />
                        ) : (
                          `R$ ${formatCurrency(pagamento.valor_parcela)}`
                        )}
                      </td>
                      <td className={styles.colPayment}>
                        {pagamento.isEditing ? (
                          <input
                            type="text"
                            value={pagamento.meio_pagamento || ''}
                            onChange={(e) => handlePagamentoFieldChange(oIdx, pIdx, 'meio_pagamento', e.target.value)}
                            className={styles.cellInput}
                          />
                        ) : (
                          pagamento.meio_pagamento || '-'
                        )}
                      </td>
                      <td className={styles.colActions}>
                        {pagamento.isEditing ? (
                          <button
                            className={styles.iconButton}
                            onClick={() => handleSavePagamento(oIdx, pIdx)}
                            title="Salvar"
                          >
                            ✓
                          </button>
                        ) : (
                          <>
                            <button
                              className={styles.iconButton}
                              onClick={() => handleEditPagamento(oIdx, pIdx)}
                              title="Editar"
                            >
                              ✎
                            </button>
                            <button
                              className={styles.iconButton}
                              onClick={() => handleDeletePagamento(oIdx, pIdx)}
                              title="Excluir"
                            >
                              ×
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Linha para adicionar novo pagamento */}
                  <tr className={styles.newPagamentoRow}>
                    <td className={styles.colDate}>
                      <input
                        type="date"
                        value={formPagamento[orcamento.id]?.data_pagamento || new Date().toISOString().split('T')[0]}
                        onChange={(e) => handlePagamentoChange(orcamento.id, 'data_pagamento', e.target.value)}
                        className={styles.cellInput}
                      />
                    </td>
                    <td className={styles.colDesc}>-</td>
                    <td className={styles.colValue}>
                      <input
                        type="number"
                        value={formPagamento[orcamento.id]?.valor_parcela || ''}
                        onChange={(e) => handlePagamentoChange(orcamento.id, 'valor_parcela', e.target.value)}
                        placeholder="0,00"
                        step="0.01"
                        min="0"
                        className={styles.cellInput}
                      />
                    </td>
                    <td className={styles.colPayment}>
                      <input
                        type="text"
                        value={formPagamento[orcamento.id]?.meio_pagamento || ''}
                        onChange={(e) => handlePagamentoChange(orcamento.id, 'meio_pagamento', e.target.value)}
                        placeholder="Forma"
                        className={styles.cellInput}
                      />
                    </td>
                    <td className={styles.colActions}>
                      <button
                        className={styles.iconButton}
                        onClick={() => handleAddPagamento(orcamento.id)}
                        title="Adicionar"
                      >
                        +
                      </button>
                    </td>
                  </tr>

                  {/* Espaçamento entre orçamentos */}
                  <tr className={styles.spacerRow}>
                    <td colSpan="5">&nbsp;</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Pagamentos;
