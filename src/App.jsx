import React, { useState, useEffect, useRef } from "react";

function App() {
  const getCurrentTimeName = () => {
    return new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const [orders, setOrders] = useState(() => {
    const savedOrders = localStorage.getItem("cashier_orders");
    return savedOrders
      ? JSON.parse(savedOrders)
      : [
          {
            id: Date.now(),
            items: [],
            isPaid: false,
            name: `Đơn lúc ${getCurrentTimeName()}`,
            selected: false,
          },
        ];
  });

  const [activeOrderId, setActiveOrderId] = useState(orders[0]?.id);
  const [editingItem, setEditingItem] = useState({
    orderId: null,
    index: null,
  });
  const [focusedOrderId, setFocusedOrderId] = useState(null);
  const inputRefs = useRef({});
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });
  const ordersEndRef = useRef(null);

  // Logic chặn mất focus
  const handleBackgroundClick = () => {
    if (activeOrderId && inputRefs.current[activeOrderId]) {
      inputRefs.current[activeOrderId].focus();
    }
  };

  // Lưu LocalStorage
  useEffect(() => {
    localStorage.setItem("cashier_orders", JSON.stringify(orders));
  }, [orders]);

  // Tự động cuộn
  useEffect(() => {
    ordersEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [orders.length]);

  // Tự động focus
  useEffect(() => {
    if (focusedOrderId && inputRefs.current[focusedOrderId]) {
      inputRefs.current[focusedOrderId].focus();
      setFocusedOrderId(null);
    }
  }, [focusedOrderId, orders]);

  // --- CẬP NHẬT PHÍM TẮT MỚI: DÙNG PHÍM * ---
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // e.key === "*" đại diện cho phím sao trên cả bàn phím số và bàn phím thường
      if (e.key === "*") {
        e.preventDefault(); // Chặn việc nhập ký tự * vào ô input
        addNewOrder();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const addNewOrder = () => {
    const newId = Date.now();
    setOrders((prev) => [
      ...prev,
      {
        id: newId,
        items: [],
        isPaid: false,
        name: `Đơn lúc ${getCurrentTimeName()}`,
        selected: false,
      },
    ]);
    setActiveOrderId(newId);
    setFocusedOrderId(newId);
  };

  const handleAddItem = (orderId, value) => {
    const amount = parseFloat(value);
    if (!amount) return;
    setOrders(
      orders.map((o) =>
        o.id === orderId ? { ...o, items: [...o.items, amount * 1000] } : o,
      ),
    );
    setActiveOrderId(orderId);
  };

  const handleEditItem = (orderId, index, newValue) => {
    const amount = parseFloat(newValue);
    if (isNaN(amount)) {
      setEditingItem({ orderId: null, index: null });
      setFocusedOrderId(orderId);
      return;
    }
    setOrders(
      orders.map((o) => {
        if (o.id === orderId) {
          const newItems = [...o.items];
          newItems[index] = amount * 1000;
          return { ...o, items: newItems };
        }
        return o;
      }),
    );
    setEditingItem({ orderId: null, index: null });
    setFocusedOrderId(orderId);
  };

  const deleteOrder = (orderId) => {
    setConfirmModal({
      isOpen: true,
      message: "Bạn muốn xóa đơn hàng này?",
      onConfirm: () => {
        setOrders(orders.filter((o) => o.id !== orderId));
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const deleteSelectedOrders = () => {
    const selectedCount = orders.filter((o) => o.selected).length;
    if (selectedCount === 0) return;
    setConfirmModal({
      isOpen: true,
      message: `Bạn muốn xóa ${selectedCount} đơn hàng đã chọn?`,
      onConfirm: () => {
        setOrders(orders.filter((o) => !o.selected));
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  const handlePrint = (id) => {
    const orderElement = document.getElementById(`print-area-${id}`);
    if (!orderElement) return;

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
          body { font-family: Arial, sans-serif; width: 75mm; margin: 0; padding: 5px; color: black; }
          @page { margin: 0; size: 80mm auto; }
          hr { border: none; border-top: 2px dashed black; margin: 10px 0; }
          .flex { display: flex; justify-content: space-between; }
          h2 { font-size: 18px; text-align: center; }
        </style>
      </head>
      <body>${printContents}</body>
    </html>`);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 250);
  };

  const hasSelected = orders.some((o) => o.selected);

  return (
    <div
      className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-24 select-none"
      onClick={handleBackgroundClick}
    >
      {/* Modal Xác Nhận */}
      {confirmModal.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 transition-all">
            <h3 className="text-xl font-black mb-4 text-center">
              Xác nhận xóa
            </h3>
            <p className="text-slate-500 text-center mb-8">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setConfirmModal({ ...confirmModal, isOpen: false })
                }
                className="flex-1 py-3 bg-slate-100 font-bold rounded-2xl"
              >
                Hủy
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-200"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              className="w-5 h-5 accent-blue-600"
              checked={orders.length > 0 && orders.every((o) => o.selected)}
              onChange={(e) =>
                setOrders(
                  orders.map((o) => ({ ...o, selected: e.target.checked })),
                )
              }
            />
            <h1 className="text-xl font-black text-blue-600 uppercase">
              BÁN HÀNG
            </h1>
          </div>

          <div className="flex gap-3">
            {hasSelected && (
              <button
                onClick={deleteSelectedOrders}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold border border-red-200 hover:bg-red-100 transition-all"
              >
                XÓA ĐÃ CHỌN ({orders.filter((o) => o.selected).length})
              </button>
            )}
            <button
              onClick={addNewOrder}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
            >
              + THÊM ĐƠN (Phím *)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => {
          const total = order.items.reduce((sum, i) => sum + i, 0);
          const isActive = order.id === activeOrderId;

          return (
            <div
              key={order.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveOrderId(order.id);
              }}
              className={`bg-white rounded-[32px] border-2 transition-all duration-300 relative overflow-hidden
                ${isActive ? "border-blue-600 ring-4 ring-blue-100 shadow-xl scale-[1.02] z-10" : "border-transparent shadow-sm hover:border-slate-200"}`}
            >
              {/* Card Header */}
              <div
                className={`p-4 flex justify-between items-center ${order.isPaid ? "bg-green-500" : isActive ? "bg-blue-600" : "bg-slate-800"} text-white`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={order.selected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      setOrders(
                        orders.map((o) =>
                          o.id === order.id
                            ? { ...o, selected: e.target.checked }
                            : o,
                        ),
                      )
                    }
                    className="w-4 h-4 accent-white"
                  />
                  <span className="text-[10px] font-bold uppercase">
                    {order.name}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrint(order.id);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    🖨️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOrder(order.id);
                    }}
                    className="p-2 hover:bg-red-400 rounded-lg transition-colors font-bold text-xs"
                  >
                    XÓA
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6" onClick={(e) => e.stopPropagation()}>
                <div
                  onClick={() =>
                    setOrders(
                      orders.map((o) =>
                        o.id === order.id ? { ...o, isPaid: !o.isPaid } : o,
                      ),
                    )
                  }
                  className={`mb-4 py-2 rounded-2xl text-center font-black text-xs cursor-pointer border-2 transition-all
                  ${order.isPaid ? "bg-green-50 text-green-600 border-green-200" : "bg-orange-50 text-orange-600 border-orange-200"}`}
                >
                  {order.isPaid ? "✓ ĐÃ THANH TOÁN" : "● CHỜ THANH TOÁN"}
                </div>

                <div className="text-center mb-6">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Tổng cộng
                  </span>
                  <h2
                    className={`text-4xl font-black ${order.isPaid ? "text-green-600" : "text-slate-800"}`}
                  >
                    {total.toLocaleString("vi-VN")}{" "}
                    <span className="text-sm font-normal opacity-40">đ</span>
                  </h2>
                </div>

                {!order.isPaid && (
                  <div className="relative mb-6">
                    <input
                      ref={(el) => (inputRefs.current[order.id] = el)}
                      type="number"
                      placeholder="Nhập số..."
                      onFocus={() => setActiveOrderId(order.id)}
                      className={`w-full border-2 rounded-2xl p-4 text-right font-black text-2xl outline-none transition-all
                        ${isActive ? "border-blue-300 bg-blue-50 text-blue-700 shadow-inner" : "border-slate-100 bg-slate-50"}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddItem(order.id, e.target.value);
                          e.target.value = "";
                        }
                      }}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">
                      .000
                    </span>
                  </div>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {order.items
                    .slice()
                    .reverse()
                    .map((amount, revIdx) => {
                      const originalIdx = order.items.length - 1 - revIdx;
                      const isEditing =
                        editingItem.orderId === order.id &&
                        editingItem.index === originalIdx;

                      return (
                        <div
                          key={originalIdx}
                          className="flex justify-between items-center group cursor-pointer"
                          onClick={() =>
                            !order.isPaid &&
                            setEditingItem({
                              orderId: order.id,
                              index: originalIdx,
                            })
                          }
                        >
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            Mã {originalIdx + 1}
                          </span>
                          {isEditing ? (
                            <div className="flex items-center border-b-2 border-blue-500 animate-pulse">
                              <input
                                autoFocus
                                type="number"
                                defaultValue={amount / 1000}
                                onFocus={(e) => e.target.select()}
                                onBlur={(e) =>
                                  handleEditItem(
                                    order.id,
                                    originalIdx,
                                    e.target.value,
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleEditItem(
                                      order.id,
                                      originalIdx,
                                      e.target.value,
                                    );
                                  if (e.key === "Escape") {
                                    setEditingItem({
                                      orderId: null,
                                      index: null,
                                    });
                                    setFocusedOrderId(order.id);
                                  }
                                }}
                                className="w-16 text-right font-black outline-none bg-transparent"
                              />
                              <span className="text-blue-500 font-bold">
                                .000
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                              +{amount.toLocaleString("vi-VN")} đ
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Print Template (Hidden) */}
              <div id={`print-area-${order.id}`} className="hidden">
                <div style={{ textAlign: "center" }}>
                  <h3>HÓA ĐƠN</h3>
                  <p>{order.name}</p>
                  <hr />
                </div>
                {order.items.map((a, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Mã {i + 1}:</span>
                    <span>{a.toLocaleString()}đ</span>
                  </div>
                ))}
                <hr />
                <div style={{ textAlign: "right" }}>
                  <strong>TỔNG: {total.toLocaleString()}đ</strong>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={ordersEndRef} />
      </div>

      {/* Footer Tổng Nợ */}
      <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex flex-col items-end">
        <span className="text-[10px] font-bold uppercase text-slate-400">
          Tổng tiền nợ
        </span>
        <span className="text-2xl font-black text-red-400">
          {orders
            .filter((o) => !o.isPaid)
            .reduce((acc, o) => acc + o.items.reduce((s, i) => s + i, 0), 0)
            .toLocaleString("vi-VN")}{" "}
          đ
        </span>
      </div>
    </div>
  );
}

export default App;
