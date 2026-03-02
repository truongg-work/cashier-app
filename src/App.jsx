import React, { useState, useEffect, useRef } from "react";

function App() {
  const getCurrentTimeName = () => {
    return new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 1. Khởi tạo state từ localStorage để không mất dữ liệu
  const [orders, setOrders] = useState(() => {
    const savedOrders = localStorage.getItem("cashier_orders");
    return savedOrders
      ? JSON.parse(savedOrders)
      : [
          {
            id: Date.now(),
            items: [],
            isPaid: false,
            name: `Đơn lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
            selected: false,
          },
        ];
  });

  // 2. Lưu vào localStorage mỗi khi orders thay đổi
  useEffect(() => {
    localStorage.setItem("cashier_orders", JSON.stringify(orders));
  }, [orders]);

  const [focusedOrderId, setFocusedOrderId] = useState(null);
  const inputRefs = useRef({});
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });
  const ordersEndRef = useRef(null);

  useEffect(() => {
    ordersEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [orders.length]);

  useEffect(() => {
    if (focusedOrderId && inputRefs.current[focusedOrderId]) {
      inputRefs.current[focusedOrderId].focus();
      setFocusedOrderId(null);
    }
  }, [focusedOrderId, orders]);

  const addNewOrder = () => {
    const newId = Date.now();
    setOrders([
      ...orders,
      {
        id: newId,
        items: [],
        isPaid: false,
        name: `Đơn lúc ${getCurrentTimeName()}`,
        selected: false,
      },
    ]);
    setFocusedOrderId(newId);
  };

  const handleAddItem = (orderId, value) => {
    const amount = parseFloat(value);
    if (!amount) return;
    setOrders(
      orders.map((order) =>
        order.id === orderId
          ? { ...order, items: [...order.items, amount * 1000] }
          : order,
      ),
    );
  };

  const togglePaid = (orderId) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, isPaid: !order.isPaid } : order,
      ),
    );
  };

  const deleteOrder = (orderId) => {
    setConfirmModal({
      isOpen: true,
      message: "Bạn có chắc chắn muốn xóa đơn hàng này không?",
      onConfirm: () => {
        setOrders(orders.filter((o) => o.id !== orderId));
        delete inputRefs.current[orderId];
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const toggleSelect = (orderId) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, selected: !order.selected } : order,
      ),
    );
  };

  const toggleSelectAll = (e) => {
    const isChecked = e.target.checked;
    setOrders(orders.map((order) => ({ ...order, selected: isChecked })));
  };

  const deleteSelected = () => {
    const count = orders.filter((o) => o.selected).length;
    setConfirmModal({
      isOpen: true,
      message: `Bạn có chắc chắn muốn xóa ${count} đơn đã chọn?`,
      onConfirm: () => {
        const selectedIds = orders.filter((o) => o.selected).map((o) => o.id);
        setOrders(orders.filter((o) => !o.selected));
        selectedIds.forEach((id) => delete inputRefs.current[id]);
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  // 3. HÀM IN MỚI SỬ DỤNG IFRAME (KHÔNG RELOAD TRANG)
  const handlePrint = (id) => {
    const orderElement = document.getElementById(`print-area-${id}`);
    if (!orderElement) return;

    // Tạo một iframe ẩn
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const printContents = orderElement.innerHTML;

    doc.open();
    doc.write(`
      <html>
        <head>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 80mm; 
              margin: 0; 
              padding: 10px;
              color: black;
            }
            @page { margin: 0; size: 80mm auto; }
            hr { border-top: 1px dashed black; }
            .flex { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${printContents}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Gọi lệnh in từ iframe
    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    // Xóa iframe sau khi in xong
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };

  const selectedCount = orders.filter((o) => o.selected).length;
  const isAllSelected = orders.length > 0 && selectedCount === orders.length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24">
      {/* MODAL XÁC NHẬN */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600 mb-4 font-bold text-3xl">
                ⚠️
              </div>
              <h3 className="text-xl font-black mb-2">Xác nhận</h3>
              <p className="text-slate-500 font-medium mb-8">
                {confirmModal.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmModal({ ...confirmModal, isOpen: false })
                  }
                  className="flex-1 px-4 py-3 bg-slate-100 font-bold rounded-2xl"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-2xl"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
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
              <span className="text-xs font-bold text-slate-500 uppercase">
                Tất cả
              </span>
            </div>
            <div>
              <h1 className="text-xl font-black text-blue-600 uppercase">
                QUẢN LÝ BÁN HÀNG
              </h1>
              <p className="text-[10px] text-slate-400 font-bold italic mt-1 uppercase tracking-wider">
                Nguyen Truong • x1.000đ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <button
                onClick={deleteSelected}
                className="bg-red-50 text-red-600 px-4 py-3 rounded-xl font-bold text-sm border border-red-200"
              >
                🗑️ Xóa {selectedCount}
              </button>
            )}
            <button
              onClick={addNewOrder}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95"
            >
              + THÊM ĐƠN MỚI
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => {
            const total = order.items.reduce((sum, i) => sum + i, 0);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl shadow-sm border-2 transition-all relative ${order.selected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-100"}`}
              >
                <div
                  className={`p-4 flex justify-between items-center ${order.isPaid ? "bg-green-500 text-white" : "bg-slate-800 text-white"}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={order.selected}
                      onChange={() => toggleSelect(order.id)}
                      className="w-5 h-5 cursor-pointer accent-blue-400 rounded"
                    />
                    <span className="font-bold uppercase tracking-widest text-[10px]">
                      {order.name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePrint(order.id)}
                      className="bg-white/20 hover:bg-white/40 p-1.5 rounded-lg transition-colors text-lg"
                      title="In hóa đơn"
                    >
                      🖨️
                    </button>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="opacity-50 hover:opacity-100 text-[10px] font-bold uppercase"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <div
                    onClick={() => togglePaid(order.id)}
                    className={`cursor-pointer mb-4 py-3 px-4 rounded-2xl text-center font-black text-xs transition-all border-2 ${order.isPaid ? "bg-green-100 text-green-600 border-green-200" : "bg-orange-50 text-orange-600 border-orange-200 animate-pulse"}`}
                  >
                    {order.isPaid ? "✓ ĐÃ THANH TOÁN" : "● CHỜ THANH TOÁN"}
                  </div>

                  <div className="text-center mb-4">
                    <h2
                      className={`text-4xl font-black ${order.isPaid ? "text-green-600" : "text-slate-800"}`}
                    >
                      {total.toLocaleString("vi-VN")}{" "}
                      <span className="text-sm font-normal opacity-50">đ</span>
                    </h2>
                  </div>

                  {!order.isPaid && (
                    <div className="relative mb-4">
                      <input
                        ref={(el) => (inputRefs.current[order.id] = el)}
                        type="number"
                        placeholder="Số tiền..."
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-right font-black text-blue-600 text-xl focus:outline-none focus:border-blue-500 transition-all"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddItem(order.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg">
                        .000
                      </span>
                    </div>
                  )}

                  {/* VÙNG NỘI DUNG SẼ IN (ẨN TRÊN WEB) */}
                  <div id={`print-area-${order.id}`} className="hidden">
                    <div style={{ textAlign: "center", marginBottom: "10px" }}>
                      <h2 style={{ fontSize: "18px", margin: "0" }}>
                        HÓA ĐƠN BÁN HÀNG
                      </h2>
                      <p style={{ fontSize: "10px" }}>{order.name}</p>
                      <p style={{ fontSize: "10px" }}>
                        Ngày: {new Date().toLocaleString("vi-VN")}
                      </p>
                      <hr />
                    </div>
                    <div style={{ minHeight: "100px" }}>
                      {order.items.map((amount, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            marginBottom: "5px",
                          }}
                        >
                          <span>Món {idx + 1}:</span>
                          <span>{amount.toLocaleString("vi-VN")} đ</span>
                        </div>
                      ))}
                    </div>
                    <hr />
                    <div style={{ textAlign: "right", marginTop: "10px" }}>
                      <strong style={{ fontSize: "16px" }}>
                        TỔNG: {total.toLocaleString("vi-VN")} đ
                      </strong>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        marginTop: "20px",
                        fontSize: "10px",
                      }}
                    >
                      Cảm ơn quý khách!
                      <br />
                      Hẹn gặp lại.
                    </div>
                  </div>

                  {/* HIỂN THỊ DANH SÁCH MÓN TRÊN WEB */}
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {order.items
                      .slice()
                      .reverse()
                      .map((amount, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm py-2 border-b border-slate-50 last:border-0"
                        >
                          <span className="text-slate-400 font-medium text-xs">
                            Món {order.items.length - idx}
                          </span>
                          <span className="font-bold text-slate-700">
                            +{amount.toLocaleString("vi-VN")} đ
                          </span>
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
        <p className="text-[10px] opacity-50 font-bold uppercase tracking-wider text-slate-400">
          Tiền đang nợ
        </p>
        <p className="text-2xl font-black text-red-400">
          {orders
            .filter((o) => !o.isPaid)
            .reduce((acc, o) => acc + o.items.reduce((s, i) => s + i, 0), 0)
            .toLocaleString("vi-VN")}{" "}
          đ
        </p>
      </div>
    </div>
  );
}

export default App;
