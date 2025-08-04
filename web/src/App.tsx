import { useState } from 'react'
import './App.css'
import AccountsList from './components/accounts_list'
import Welcome from './components/welcome'
import NewItemModal from './components/new_item_modal'

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
      <div className="main-layout">
        <div className="left-column">
          <Welcome userName="Hayden"/>
          <AccountsList key={refreshKey} />
        </div>
        <div className="right-column">
          <div className="transaction-list-placeholder">
            Transaction List Component (Coming Soon)
          </div>
        </div>
      </div>
      
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
