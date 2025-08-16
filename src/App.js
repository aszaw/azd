import React from 'react';

// --- API base URLs (from .env) ---
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";
const FILES_BASE = process.env.REACT_APP_FILES_BASE || "http://localhost:8082";

// Chi Psi Logo & FileIcon components remain unchanged

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [files, setFiles] = React.useState([]);
  const [filteredFiles, setFilteredFiles] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // --- Password Protection ---
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === '9737') {
      setIsAuthenticated(true);
      setError('');
      fetchFiles('');  // load initial files
    } else {
      setError('Incorrect Password. Please try again.');
    }
  };

  // --- Fetch files from backend ---
  const fetchFiles = async (query = '') => {
    setIsLoading(true);
    try {
      const url = query ? `${API_BASE}/search?query=${encodeURIComponent(query)}` : `${API_BASE}/search?query=`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      // Add full URLs
      const formatted = data.map(f => ({ ...f, url: `${FILES_BASE}/uploads/${f.filename}` }));
      setFiles(formatted);
      setFilteredFiles(formatted);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  // --- Search handler ---
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchFiles(value);
  };

  // --- File Upload ---
  const handleFileUpload = async (e) => {
    e.preventDefault();
    const { file, class: className } = e.target.elements;

    if (!file.files[0]) return;

    setIsUploading(true);
    setUploadSuccess(false);

    const uploadedFile = file.files[0];
    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("class", className.value);

    try {
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      setUploadSuccess(true);
      setTimeout(() => {
        setShowUploadModal(false);
        setIsUploading(false);
        setUploadSuccess(false);
        fetchFiles(search); // refresh list
      }, 2000);
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  };

  // --- Render logic remains mostly the same ---
  if (!isAuthenticated) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <div className="flex justify-center mb-6"><ChiPsiLogo /></div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Enter Access Code</h2>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button type="submit" className="w-full mt-4 bg-violet-700 hover:bg-violet-800 text-white font-bold py-3 px-4 rounded-lg transition duration-300">
              Enter
            </button>
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
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-violet-700 hover:bg-violet-800 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          >
            Upload File
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Find Resources</h2>
          <input type="text" placeholder="Search by filename or class..." value={search} onChange={handleSearchChange} className="p-3 border rounded-lg w-full" />
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500">Loading files...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredFiles.length > 0 ? (
              filteredFiles.map(file => (
                <div key={file.filename} className="bg-white rounded-lg shadow-md overflow-hidden hover:-translate-y-1 transition">
                  <div className="p-4 flex flex-col items-center justify-center bg-gray-50">
                    <FileIcon fileType={file.type || ''} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg truncate text-gray-800" title={file.filename}>{file.filename}</h3>
                    <p className="text-gray-600 text-sm">Class: {file.class}</p>
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block w-full text-center bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg transition">
                      Download
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 col-span-full">No files found.</p>
            )}
          </div>
        )}
      </main>

      {/* Upload modal remains mostly the same, just simplified form with "class" field */}
    </div>
  );
}

export default App;
