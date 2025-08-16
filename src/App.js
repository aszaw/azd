import React from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Helper Components ---

const ChiPsiLogo = () => (
  <svg className="h-12 w-12" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <polygon points="0,0 100,0 50,50" fill="#683491" />
    <polygon points="0,100 100,100 50,50" fill="#683491" />
    <polygon points="0,0 0,100 50,50" fill="#b49759" />
    <polygon points="100,0 100,100 50,50" fill="#b49759" />
  </svg>
);

const FileIcon = ({ fileType }) => {
  const icons = {
    pdf: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-violet-700" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.414a1 1 0 00-.293-.707l-4-4A1 1 0 0011.586 3H6a2 2 0 00-2-2zm2 5a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
    image: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    ),
    default: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.414a1 1 0 00-.293-.707l-4-4A1 1 0 0011.586 3H6a2 2 0 00-2-2zm2 5a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    )
  };
  if (fileType?.startsWith("image/")) return icons.image;
  if (fileType === "application/pdf") return icons.pdf;
  return icons.default;
};

// --- Main App ---

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [user, setUser] = React.useState(null);
  const [files, setFiles] = React.useState([]);
  const [filteredFiles, setFilteredFiles] = React.useState([]);
  const [search, setSearch] = React.useState({ class: '', professor: '', year: '' });
  const [isUploading, setIsUploading] = React.useState(false);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // --- Password
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === '9737') {
      setIsAuthenticated(true);
      setError('');
    } else setError('Incorrect Password. Please try again.');
  };

  // --- Firebase Auth
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else signInAnonymously(auth).catch(console.error);
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  // --- Firestore fetching
  React.useEffect(() => {
    if (user && isAuthenticated) {
      const q = query(collection(db, "files"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFiles(data);
        setFilteredFiles(data);
        setIsLoading(false);
      }, (err) => {
        console.error(err);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, isAuthenticated]);

  // --- Filtering
  React.useEffect(() => {
    let result = files;
    if (search.class) result = result.filter(f => f.class.toLowerCase().includes(search.class.toLowerCase()));
    if (search.professor) result = result.filter(f => f.professor.toLowerCase().includes(search.professor.toLowerCase()));
    if (search.year) result = result.filter(f => f.year.toString().includes(search.year));
    setFilteredFiles(result);
  }, [search, files]);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearch(prev => ({ ...prev, [name]: value }));
  };

  // --- Upload ---
  const handleFileUpload = async (e) => {
    e.preventDefault();
    const { file, class: cls, professor, year } = e.target.elements;
    if (!file.files[0]) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const uploadedFile = file.files[0];
      const storageRef = ref(storage, `files/${Date.now()}_${uploadedFile.name}`);
      const snapshot = await uploadBytes(storageRef, uploadedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, "files"), {
        name: uploadedFile.name,
        type: uploadedFile.type,
        url: downloadURL,
        class: cls.value,
        professor: professor.value,
        year: Number(year.value),
        uploadedAt: new Date(),
        uploaderId: user.uid,
      });

      setUploadSuccess(true);
      setTimeout(() => {
        setShowUploadModal(false);
        setIsUploading(false);
        setUploadSuccess(false);
      }, 2000);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  // --- Render ---
  if (!isAuthenticated) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <div className="flex justify-center mb-6"><ChiPsiLogo /></div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Enter Access Code</h2>
          <form onSubmit={handlePasswordSubmit}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"/>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button type="submit" className="w-full mt-4 bg-violet-700 hover:bg-violet-800 text-white font-bold py-3 px-4 rounded-lg transition duration-300">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <ChiPsiLogo />
          <button onClick={() => setShowUploadModal(true)} className="bg-violet-700 hover:bg-violet-800 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Upload File</button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Find Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" name="class" placeholder="Filter by Class" value={search.class} onChange={handleSearchChange} className="p-3 border rounded-lg"/>
            <input type="text" name="professor" placeholder="Filter by Professor" value={search.professor} onChange={handleSearchChange} className="p-3 border rounded-lg"/>
            <input type="text" name="year" placeholder="Filter by Year" value={search.year} onChange={handleSearchChange} className="p-3 border rounded-lg"/>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500">Loading files...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredFiles.length > 0 ? filteredFiles.map(file => (
              <div key={file.id} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition duration-300">
                <div className="p-4 flex flex-col items-center justify-center bg-gray-50"><FileIcon fileType={file.type} /></div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg truncate text-gray-800" title={file.name}>{file.name}</h3>
                  <p className="text-gray-600 text-sm">Class: {file.class}</p>
                  <p className="text-gray-600 text-sm">Professor: {file.professor}</p>
                  <p className="text-gray-600 text-sm">Year: {file.year}</p>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block w-full text-center bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Download</a>
                </div>
              </div>
            )) : <p className="text-center text-gray-500 col-span-full">No files found matching your criteria.</p>}
          </div>
        )}
      </main>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload a New File</h2>
            {!isUploading && !uploadSuccess && (
              <form onSubmit={handleFileUpload}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="file">File</label>
                  <input type="file" name="file" id="file" required className="w-full p-2 border rounded-lg"/>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="class">Class</label>
                  <input type="text" name="class" id="class" required placeholder="e.g., ECON 201" className="w-full p-3 border rounded-lg"/>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="professor">Professor</label>
                  <input type="text" name="professor" id="professor" required placeholder="e.g., Dr. Smith" className="w-full p-3 border rounded-lg"/>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="year">Year</label>
                  <input type="number" name="year" id="year" required placeholder="e.g., 2023" className="w-full p-3 border rounded-lg"/>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button type="button" onClick={() => setShowUploadModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                  <button type="submit" className="bg-violet-700 hover:bg-violet-800 text-white font-bold py-2 px-4 rounded-lg">Upload</button>
                </div>
              </form>
            )}
            {isUploading && !uploadSuccess && (
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700">Uploading...</p>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-violet-500 mx-auto mt-4"></div>
              </div>
            )}
            {uploadSuccess && (
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-lg font-semibold text-green-600">Upload Successful!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
