import { useState } from 'react'
import './App.css'
import NewItemModal from './components/new_item_modal'
import Dashboard from './components/dashboard'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalSuccess = () => {
    // Trigger a refresh of the accounts list
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <Dashboard userName="Hayden" refreshKey={refreshKey} />
      
      {/* New Button */}
      <button 
        className="new-button" 
        onClick={() => setIsModalOpen(true)}
        title="Create new account or transaction"
      >
        New
      </button>

      {/* Modal */}
      <NewItemModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </>
  )
}

export default App
