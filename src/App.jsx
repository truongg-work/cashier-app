import React, { useState, useEffect, useRef } from 'react';

function App() {
  const getCurrentTimeName = () => {
    return new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const [orders, setOrders] = useState([
    { id: Date.now(), items: [], isPaid: false, name: `Đơn lúc ${getCurrentTimeName()}`, selected: false }
  ]);

  // State quản lý Modal xác nhận
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  const ordersEndRef = useRef(null);

  useEffect(() => {
    ordersEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [orders.length]);

  // Hàm mở modal thay thế cho window.confirm
  const showConfirm = (message, action) => {
    setConfirmModal({
      isOpen: true,
      message: message,
      onConfirm: () => {
        action();
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const addNewOrder = () => {
    const newOrder = {
      id: Date.now(),
      items: [],
      isPaid: false,
      name: `Đơn lúc ${getCurrentTimeName()}`,
      selected: false
    };
    setOrders([...orders, newOrder]);
  };

  const handleAddItem = (orderId, value) => {
    const amount = parseFloat(value);
    if (!amount) return;
    setOrders(orders.map(order => order.id === orderId 
      ? { ...order, items: [...order.items, amount * 1000] } 
      : order
    ));
  };

  const togglePaid = (orderId) => {
    setOrders(orders.map(order => order.id === orderId ? { ...order, isPaid: !order.isPaid } : order));
  };

  const deleteOrder = (orderId) => {
    showConfirm("Bạn có chắc chắn muốn xóa đơn hàng này không?", () => {
      setOrders(orders.filter(o => o.id !== orderId));
    });
  };

  const toggleSelect = (orderId) => {
    setOrders(orders.map(order => order.id === orderId ? { ...order, selected: !order.selected } : order));
  };

  const toggleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setOrders(orders.map(order => ({ ...order, selected: isChecked })));
  };

  const deleteSelected = () => {
    const count = orders.filter(o => o.selected).length;
    showConfirm(`Bạn có chắc chắn muốn xóa ${count} đơn đã chọn?`, () => {
      setOrders(orders.filter(o => !o.selected));
    });
  };

  const selectedCount = orders.filter(o => o.selected).length;
  const isAllSelected = orders.length > 0 && selectedCount === orders.length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24">
      
      {/* MODAL XÁC NHẬN TÙY CHỈNH */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600 mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-black mb-2 text-slate-800">Xác nhận xóa</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-all"
                >
                  Đồng ý xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER STICKY */}
      <div className="sticky top-0 z-50 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
              <input 
                type="checkbox" 
                className="w-5 h-5 cursor-pointer accent-blue-600"
                checked={isAllSelected}
                onChange={toggleSelectAll}
              />
              <span className="text-xs font-bold text-slate-500 uppercase">Tất cả</span>
            </div>
            
            <div>
              <h1 className="text-xl font-black text-blue-600 uppercase tracking-tight leading-none">Quản lý bán hàng</h1>
              <p className="text-[10px] text-slate-400 font-bold italic mt-1 uppercase tracking-wider">x1.000đ | ENTER để cộng tiền</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <button 
                onClick={deleteSelected}
                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-xl font-bold text-sm transition-all border border-red-200 flex items-center gap-2"
              >
                🗑️ Xóa {selectedCount} đơn
              </button>
            )}
            
            <button 
              onClick={addNewOrder}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 active:scale-95"
            >
              <span className="text-xl">+</span> THÊM ĐƠN MỚI
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => {
            const total = order.items.reduce((sum, i) => sum + i, 0);
            
            return (
              <div key={order.id} className={`bg-white rounded-3xl shadow-sm border-2 transition-all overflow-hidden relative ${order.selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100'}`}>
                
                <div className={`p-4 flex justify-between items-center ${order.isPaid ? 'bg-green-500 text-white' : 'bg-slate-800 text-white'}`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={order.selected}
                      onChange={() => toggleSelect(order.id)}
                      className="w-5 h-5 cursor-pointer accent-blue-400 border-none rounded"
                    />
                    <span className="font-bold uppercase tracking-widest text-[10px]">{order.name}</span>
                  </div>
                  <button onClick={() => deleteOrder(order.id)} className="opacity-50 hover:opacity-100 text-[10px] font-bold uppercase tracking-tighter">Xóa đơn</button>
                </div>

                <div className="p-5">
                  <div 
                    onClick={() => togglePaid(order.id)}
                    className={`cursor-pointer mb-4 py-3 px-4 rounded-2xl text-center font-black text-xs transition-all select-none border-2 ${
                      order.isPaid 
                      ? 'bg-green-100 text-green-600 border-green-200' 
                      : 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse'
                    }`}
                  >
                    {order.isPaid ? '✓ ĐÃ THANH TOÁN' : '● CHỜ THANH TOÁN'}
                  </div>

                  <div className="text-center mb-4">
                    <h2 className={`text-4xl font-black ${order.isPaid ? 'text-green-600' : 'text-slate-800'}`}>
                      {total.toLocaleString('vi-VN')} <span className="text-sm font-normal opacity-50">đ</span>
                    </h2>
                  </div>

                  {!order.isPaid && (
                    <div className="relative mb-4">
                      <input 
                        type="number"
                        placeholder="Số tiền..."
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-right font-black text-blue-600 text-xl focus:outline-none focus:border-blue-500 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddItem(order.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">.000</span>
                    </div>
                  )}

                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {order.items.slice().reverse().map((amount, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                        <span className="text-slate-400 font-medium text-xs">Món {order.items.length - idx}</span>
                        <span className="font-bold text-slate-700">+{amount.toLocaleString('vi-VN')} đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={ordersEndRef} />
        </div>
      </div>

      <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 z-50">
        <p className="text-[10px] opacity-50 font-bold uppercase tracking-wider">Tiền đang nợ</p>
        <p className="text-2xl font-black text-red-400">
          {orders.filter(o => !o.isPaid).reduce((acc, o) => acc + o.items.reduce((s, i) => s + i, 0), 0).toLocaleString('vi-VN')} đ
        </p>
      </div>
    </div>
  );
}

export default App;