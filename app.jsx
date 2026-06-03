import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, Trash2, User as UserIcon, LogOut, LogIn } from 'lucide-react';

// --- FIREBASE SECTION ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";

// आपकी नई फायरबेस कॉन्फ़िगरेशन जो आपने अभी सेट की है
const firebaseConfig = {
  apiKey: "AIzaSyCMMlkzd5p0BozZtsQ9X1NE7ycR7EtYgRs",
  authDomain: "shopmy-37612.firebaseapp.com",
  projectId: "shopmy-37612",
  storageBucket: "shopmy-37612.firebasestorage.app",
  messagingSenderId: "350831684030",
  appId: "1:350831684030:web:e2891cd3696d09befe31ef",
  measurementId: "G-3NKXQ16FLQ"
};

// Initialize Firebase & Services
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app); 

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Product[]>([]);
  
  // लॉगिन यूजर की स्टेट मैनेजमेंट
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // लॉगिन फॉर्म इनपुट की स्टेट्स
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // कंडीशन: क्या लॉगिन व्यक्ति सिर्फ आप (अरविंद जी) हैं?
  const isAdmin = currentUser?.email === 'arvindtiwari9966118@gmail.com';

  // 1. लॉगिन स्टेट को ट्रैक करना (Authentication Listener)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. रीयल-टाइम क्लाउड डेटाबेस से प्रोडक्ट्स लोड करना
  useEffect(() => {
    const unsubscribeData = onSnapshot(collection(db, "products"), (snapshot) => {
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productList);
      setLoading(false);
    });

    return () => unsubscribeData();
  }, []);

  // 3. नया प्रोडक्ट अपलोड करना (सिर्फ आपकी आईडी के लिए काम करेगा)
  const handleAddProduct = async (newP: Omit<Product, 'id'>) => {
    if (!isAdmin) return alert("सुरक्षा उल्लंघन: सिर्फ अरविंद जी ही प्रोडक्ट जोड़ सकते हैं!");
    try {
      await addDoc(collection(db, "products"), newP);
      alert("Product added to Cloud Database!");
    } catch (e) {
      alert("Error adding product: " + e);
    }
  };

  // 4. प्रोडक्ट डिलीट करना (सिर्फ आपकी आईडी के लिए काम करेगा)
  const handleDeleteProduct = async (id: string) => {
    if (!isAdmin) return alert("सुरक्षा उल्लंघन: सिर्फ अरविंद जी ही प्रोडक्ट हटा सकते हैं!");
    if (confirm("Delete this product permanently?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        alert("Product deleted!");
      } catch (e) {
        alert("Error deleting: " + e);
      }
    }
  };

  // एडमिन लॉगिन फंक्शन
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Welcome Admin Arvind Ji!");
      setEmail('');
      setPassword('');
      setActiveTab('home');
    } catch (error: any) {
      alert("Login Failed: " + error.message);
    }
  };

  // लॉगआउट फंक्शन
  const handleLogout = () => {
    signOut(auth);
    alert("Logged out successfully!");
  };

  // कार्ट में सामान जोड़ना
  const addToCart = (p: Product) => { 
    setCart([...cart, p]); 
    alert("Added to Bag!"); 
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans">
      {/* Navbar (मीशो स्टाइल मुख्य हेडर) */}
      <nav className="bg-white border-b sticky top-0 z-50 px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-black text-[#f43397] tracking-tight cursor-pointer" onClick={() => setActiveTab('home')}>meesho</h1>
        <div className="flex gap-6 items-center">
          <UserIcon className="w-6 h-6 text-gray-600 cursor-pointer" onClick={() => setActiveTab('profile')} />
          <div className="relative cursor-pointer" onClick={() => setActiveTab('cart')}>
            <ShoppingCart className="w-6 h-6 text-gray-600" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#f43397] text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">
                {cart.length}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto p-4">
        {/* HOME VIEW: प्रोडक्ट्स ग्रिड */}
        {activeTab === 'home' && (
          <>
            {loading ? (
              <p className="text-center py-10 text-gray-500 font-medium">Loading Products from Cloud...</p>
            ) : products.length === 0 ? (
              <p className="text-center py-10 text-gray-400">दुकान में अभी कोई प्रोडक्ट नहीं है। एडमिन पैनल से अपलोड करें।</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    <img src={p.image} className="h-44 w-full object-cover" alt={p.name} />
                    <div className="p-3 flex-1 flex flex-col">
                      <p className="text-gray-500 text-sm truncate">{p.name}</p>
                      <p className="text-lg font-bold mt-1">₹{p.price}</p>
                      <div className="mt-auto pt-3 flex gap-2">
                        <button onClick={() => addToCart(p)} className="flex-1 text-[11px] border border-[#f43397] text-[#f43397] py-2 rounded font-bold hover:bg-pink-50">Add Bag</button>
                        <button className="flex-1 text-[11px] bg-[#f43397] text-white py-2 rounded font-bold hover:bg-[#e32286]">Buy Now</button>
                      </div>
                      
                      {/* डिलीट का बटन सिर्फ आपको (अरविंद जी) लॉगिन होने पर दिखेगा */}
                      {isAdmin && (
                        <button onClick={() => handleDeleteProduct(p.id)} className="mt-2 text-red-500 flex items-center justify-center gap-1 text-xs font-medium pt-2 border-t hover:text-red-700">
                          <Trash2 className="w-3 h-3" /> Delete Item
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* CART VIEW: शॉपिंग बैग */}
        {activeTab === 'cart' && (
          <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow border mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Shopping Bag ({cart.length})</h2>
            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-6">Your bag is empty.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex gap-4 items-center border-b pb-3">
                    <img src={item.image} className="w-16 h-16 object-cover rounded-lg" alt="" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                      <p className="font-bold text-gray-900">₹{item.price}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 flex justify-between items-center font-bold text-lg">
                  <span>Total Amount:</span>
                  <span className="text-[#f43397]">₹{cart.reduce((total, item) => total + item.price, 0)}</span>
                </div>
                <button onClick={() => alert("Order Placed Successfully!")} className="w-full bg-black text-white py-3 rounded-xl font-bold mt-4">
                  Proceed to Pay
                </button>
              </div>
            )}
          </div>
        )}

        {/* PROFILE VIEW: सुरक्षित एडमिन लॉगिन पैनल */}
        {activeTab === 'profile' && (
             <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow mt-10 border">
                {!currentUser ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">Admin Login Panel</h2>
                    <p className="text-xs text-gray-400">कंट्रोल पैनल एक्सेस करने के लिए फायरबेस क्रेडेंशियल डालें</p>
                    <input type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-3 rounded-xl outline-none border-gray-200 focus:border-[#f43397]" required />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-3 rounded-xl outline-none border-gray-200 focus:border-[#f43397]" required />
                    <button type="submit" className="w-full bg-[#f43397] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#e32286]"><LogIn className="w-4 h-4"/> Login</button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">Logged in as: <span className="font-bold text-black">{currentUser.email}</span></p>
                    {isAdmin ? (
                      <p className="text-green-600 text-xs font-bold bg-green-50 p-3 rounded-xl border border-green-200">✓ एडमिन एक्सेस सक्रिय है। आप प्रोडक्ट्स अपलोड/डिलीट कर सकते हैं।</p>
                    ) : (
                      <p className="text-amber-600 text-xs font-bold bg-amber-50 p-3 rounded-xl border border-amber-200">⚠️ सामान्य यूजर मोड। आपके पास एडमिन अधिकार नहीं हैं।</p>
                    )}
                    <button onClick={handleLogout} className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center justify-center gap-2 mx-auto hover:bg-red-600"><LogOut className="w-4 h-4"/> Logout</button>
                  </div>
                )}
             </div>
        )}
      </main>

      {/* फ्लोटिंग प्लस (+) बटन: सिर्फ आपको (अरविंद जी) एडमिन लॉगिन होने पर दिखेगा */}
      {isAdmin && (
        <button onClick={() => setIsAddModalOpen(true)} className="fixed bottom-6 right-6 bg-[#f43397] text-white p-4 rounded-full shadow-2xl z-50 hover:scale-105 transition-transform">
          <Plus />
        </button>
      )}

      {/* Product Add Popup Modal */}
      <AdminModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddProduct} />
    </div>
  );
}

function AdminModal({ isOpen, onClose, onAdd }: any) {
  if (!isOpen) return null;
  const submit = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onAdd({
      name: fd.get('name') as string,
      price: Number(fd.get('price')),
      image: fd.get('image') as string
    });
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <form onSubmit={submit} className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl">
        <h2 className="font-bold text-xl text-gray-800">New Product</h2>
        <input name="name" placeholder="Name (e.g. Silk Saree)" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#f43397] outline-none" required />
        <input name="price" type="number" placeholder="Price (₹)" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#f43397] outline-none" required />
        <input name="image" placeholder="Image Link (URL)" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[#f43397] outline-none" required />
        <button className="w-full bg-[#f43397] text-white py-3 rounded-xl font-bold shadow-lg">Upload to Store</button>
        <button type="button" onClick={onClose} className="w-full text-gray-400 font-medium">Cancel</button>
      </form>
    </div>
  );
}