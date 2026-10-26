/**
 * CoreStock - Inventory Management System
 * Vanilla JavaScript Frontend Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const state = {
    products: [],
    filteredProducts: [],
    searchQuery: '',
    selectedCategory: 'ALL',
    lowStockOnly: false,
    sortField: 'created_at',
    sortOrder: 'desc', // 'asc' or 'desc'
    editingProductId: null,
    productToDelete: null,
    isSubmitting: false,
    isConfigured: true
  };

  // ==========================================
  // DOM ELEMENT REFERENCES
  // ==========================================
  
  // Dashboard Stat Elements
  const statTotalProducts = document.getElementById('statTotalProducts');
  const statTotalStock = document.getElementById('statTotalStock');
  const statLowStock = document.getElementById('statLowStock');
  const statTotalValue = document.getElementById('statTotalValue');
  const sidebarProductCount = document.getElementById('sidebarProductCount');
  const sidebarLowStockCount = document.getElementById('sidebarLowStockCount');

  // Database status
  const dbStatusDot = document.getElementById('dbStatusDot');
  const dbStatusText = document.getElementById('dbStatusText');
  const dbStatusSub = document.getElementById('dbStatusSub');
  const dbBanner = document.getElementById('dbBanner');

  // Table & Containers
  const productsTableBody = document.getElementById('productsTableBody');
  const tableLoadingState = document.getElementById('tableLoadingState');
  const tableEmptyState = document.getElementById('tableEmptyState');
  const emptyStateTitle = document.getElementById('emptyStateTitle');
  const emptyStateDescription = document.getElementById('emptyStateDescription');
  const visibleCount = document.getElementById('visibleCount');
  const totalCount = document.getElementById('totalCount');

  // Search & Filter Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryFilter = document.getElementById('categoryFilter');
  const filterLowStockBtn = document.getElementById('filterLowStockBtn');
  const activeFiltersBar = document.getElementById('activeFiltersBar');
  const filterChipsContainer = document.getElementById('filterChipsContainer');
  const resetAllFiltersBtn = document.getElementById('resetAllFiltersBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  // Modals & Forms
  const productModal = document.getElementById('productModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const modalHeaderIcon = document.getElementById('modalHeaderIcon');
  const productForm = document.getElementById('productForm');
  const productIdInput = document.getElementById('productId');
  const productNameInput = document.getElementById('productName');
  const productCategoryInput = document.getElementById('productCategory');
  const productQuantityInput = document.getElementById('productQuantity');
  const productPriceInput = document.getElementById('productPrice');
  const productDescriptionInput = document.getElementById('productDescription');
  const saveProductBtn = document.getElementById('saveProductBtn');
  const saveBtnText = document.getElementById('saveBtnText');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const openAddModalBtn = document.getElementById('openAddModalBtn');
  const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');

  // Delete Modal
  const deleteModal = document.getElementById('deleteModal');
  const deleteProductName = document.getElementById('deleteProductName');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  // Navigation & General
  const refreshBtn = document.getElementById('refreshBtn');
  const sidebar = document.getElementById('sidebar');
  const openSidebarBtn = document.getElementById('openSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const navDashboard = document.getElementById('navDashboard');
  const navInventory = document.getElementById('navInventory');
  const navLowStock = document.getElementById('navLowStock');
  const toastContainer = document.getElementById('toastContainer');

  // ==========================================
  // TOAST NOTIFICATION SYSTEM
  // ==========================================
  function showToast(type = 'info', title = '', message = '') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
      <div class="toast-body">
        <div class="toast-title">${escapeHtml(title)}</div>
        ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close notification"><i class="fa-solid fa-xmark"></i></button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const removeToast = () => {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 250);
    };

    closeBtn.addEventListener('click', removeToast);
    toastContainer.appendChild(toast);

    // Auto dismiss after 4 seconds
    setTimeout(removeToast, 4000);
  }

  // Helper: Escape HTML to avoid XSS
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Format currency
  function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }

  // Format date
  function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // ==========================================
  // API INTEGRATION & DATA FETCHING
  // ==========================================

  // Check backend and Supabase configuration status
  async function checkServerStatus() {
    try {
      const response = await fetch('/api/config-status');
      const data = await response.json();
      
      state.isConfigured = data.configured;

      if (data.configured) {
        dbStatusDot.className = 'status-indicator connected';
        dbStatusText.textContent = 'Supabase Connected';
        dbStatusSub.textContent = 'PostgreSQL Real-time';
        dbBanner.classList.add('hidden');
      } else {
        dbStatusDot.className = 'status-indicator disconnected';
        dbStatusText.textContent = 'Not Configured';
        dbStatusSub.textContent = 'Awaiting .env Keys';
        dbBanner.classList.remove('hidden');
      }
    } catch (err) {
      console.warn('Could not retrieve config status:', err);
      dbStatusDot.className = 'status-indicator disconnected';
      dbStatusText.textContent = 'Server Offline';
    }
  }

  // Fetch all products from Express API
  async function fetchProducts(showSuccessToast = false) {
    setLoading(true);

    try {
      const response = await fetch('/products');
      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || `Server responded with status ${response.status}`);
      }

      state.products = Array.isArray(resData.data) ? resData.data : [];
      updateCategoryDropdown();
      applyFiltersAndSort();
      updateDashboardStats();

      if (showSuccessToast) {
        showToast('success', 'Refreshed', 'Inventory synchronized with Supabase.');
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      showToast('error', 'Connection Error', err.message || 'Unable to connect to database.');
      state.products = [];
      applyFiltersAndSort();
      updateDashboardStats();
    } finally {
      setLoading(false);
    }
  }

  // Set loading state in UI
  function setLoading(isLoading) {
    if (isLoading) {
      tableLoadingState.classList.remove('hidden');
      tableEmptyState.classList.add('hidden');
      productsTableBody.innerHTML = '';
    } else {
      tableLoadingState.classList.add('hidden');
    }
  }

  // ==========================================
  // DASHBOARD CALCULATIONS
  // ==========================================
  function updateDashboardStats() {
    const totalProductsCount = state.products.length;
    let totalStockQty = 0;
    let lowStockCount = 0;
    let totalInventoryValue = 0;

    state.products.forEach(p => {
      const qty = Number(p.quantity) || 0;
      const price = Number(p.price) || 0;

      totalStockQty += qty;
      if (qty < 5) {
        lowStockCount++;
      }
      totalInventoryValue += (qty * price);
    });

    // Update UI counters
    statTotalProducts.textContent = totalProductsCount.toLocaleString();
    statTotalStock.textContent = totalStockQty.toLocaleString();
    statLowStock.textContent = lowStockCount.toLocaleString();
    statTotalValue.textContent = formatCurrency(totalInventoryValue);

    sidebarProductCount.textContent = totalProductsCount;
    sidebarLowStockCount.textContent = lowStockCount;
  }

  // ==========================================
  // FILTERS, SEARCH & SORTING
  // ==========================================
  function updateCategoryDropdown() {
    const categories = new Set();
    state.products.forEach(p => {
      if (p.category && p.category.trim()) {
        categories.add(p.category.trim());
      }
    });

    const currentSelection = state.selectedCategory;
    categoryFilter.innerHTML = '<option value="ALL">All Categories</option>';

    Array.from(categories).sort().forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      if (cat === currentSelection) {
        option.selected = true;
      }
      categoryFilter.appendChild(option);
    });
  }

  function applyFiltersAndSort() {
    let filtered = [...state.products];

    // 1. Text Search Filter (name, category, ID)
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const catMatch = (p.category || '').toLowerCase().includes(q);
        const idMatch = (p.id || '').toString().toLowerCase().includes(q);
        const descMatch = (p.description || '').toLowerCase().includes(q);
        return nameMatch || catMatch || idMatch || descMatch;
      });
    }

    // 2. Category Filter
    if (state.selectedCategory !== 'ALL') {
      filtered = filtered.filter(p => p.category === state.selectedCategory);
    }

    // 3. Low Stock Filter (< 5)
    if (state.lowStockOnly) {
      filtered = filtered.filter(p => Number(p.quantity) < 5);
    }

    // 4. Sorting
    filtered.sort((a, b) => {
      let valA = a[state.sortField];
      let valB = b[state.sortField];

      if (state.sortField === 'price' || state.sortField === 'quantity') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return state.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return state.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    state.filteredProducts = filtered;
    renderTable();
    renderActiveFilterChips();
  }

  function renderActiveFilterChips() {
    filterChipsContainer.innerHTML = '';
    const activeChips = [];

    if (state.searchQuery) {
      activeChips.push({
        label: `Search: "${state.searchQuery}"`,
        onRemove: () => {
          state.searchQuery = '';
          searchInput.value = '';
          clearSearchBtn.classList.add('hidden');
          applyFiltersAndSort();
        }
      });
    }

    if (state.selectedCategory !== 'ALL') {
      activeChips.push({
        label: `Category: ${state.selectedCategory}`,
        onRemove: () => {
          state.selectedCategory = 'ALL';
          categoryFilter.value = 'ALL';
          applyFiltersAndSort();
        }
      });
    }

    if (state.lowStockOnly) {
      activeChips.push({
        label: 'Low Stock (< 5)',
        onRemove: () => {
          state.lowStockOnly = false;
          filterLowStockBtn.classList.remove('active');
          applyFiltersAndSort();
        }
      });
    }

    if (activeChips.length > 0) {
      activeFiltersBar.classList.remove('hidden');
      activeChips.forEach(chip => {
        const el = document.createElement('div');
        el.className = 'filter-chip';
        el.innerHTML = `
          <span>${escapeHtml(chip.label)}</span>
          <button type="button" aria-label="Remove filter"><i class="fa-solid fa-xmark"></i></button>
        `;
        el.querySelector('button').addEventListener('click', chip.onRemove);
        filterChipsContainer.appendChild(el);
      });
    } else {
      activeFiltersBar.classList.add('hidden');
    }
  }

  // ==========================================
  // TABLE RENDERING
  // ==========================================
  function renderTable() {
    const products = state.filteredProducts;
    visibleCount.textContent = products.length;
    totalCount.textContent = state.products.length;

    if (products.length === 0) {
      productsTableBody.innerHTML = '';
      tableEmptyState.classList.remove('hidden');

      if (state.products.length === 0) {
        emptyStateTitle.textContent = 'Inventory is Empty';
        emptyStateDescription.textContent = 'No products found in the Supabase PostgreSQL database. Click below to add your first product.';
        emptyStateAddBtn.classList.remove('hidden');
      } else {
        emptyStateTitle.textContent = 'No Matching Products';
        emptyStateDescription.textContent = 'Try adjusting your search query or filter settings.';
        emptyStateAddBtn.classList.add('hidden');
      }
      return;
    }

    tableEmptyState.classList.add('hidden');

    const rowsHtml = products.map(product => {
      const qty = Number(product.quantity) || 0;
      const price = Number(product.price) || 0;
      const totalVal = qty * price;
      const isLowStock = qty < 5;
      const isOutOfStock = qty === 0;

      let stockBadge = `<span class="badge-in-stock"><i class="fa-solid fa-circle-check"></i> In Stock</span>`;
      if (isOutOfStock) {
        stockBadge = `<span class="badge-out-of-stock"><i class="fa-solid fa-circle-xmark"></i> Out of Stock</span>`;
      } else if (isLowStock) {
        stockBadge = `<span class="badge-low-stock"><i class="fa-solid fa-triangle-exclamation"></i> Low Stock</span>`;
      }

      // Truncate UUID for display
      const displayId = product.id && product.id.length > 8 
        ? `${product.id.substring(0, 8)}...` 
        : (product.id || 'N/A');

      return `
        <tr data-id="${escapeHtml(product.id)}">
          <td>
            <div class="product-cell">
              <span class="product-cell-name">${escapeHtml(product.name)}</span>
              <span class="product-cell-id" title="Full ID: ${escapeHtml(product.id)}">#${escapeHtml(displayId)}</span>
            </div>
          </td>
          <td>
            <span class="category-badge">${escapeHtml(product.category || 'General')}</span>
          </td>
          <td>
            <div class="stock-cell">
              <span class="stock-count ${isLowStock ? 'text-amber' : ''}">${qty}</span>
              ${stockBadge}
            </div>
          </td>
          <td>
            <span class="price-text">${formatCurrency(price)}</span>
          </td>
          <td>
            <span class="total-value-text">${formatCurrency(totalVal)}</span>
          </td>
          <td>
            <div class="description-text" title="${escapeHtml(product.description || 'No description')}">
              ${escapeHtml(product.description || '—')}
            </div>
          </td>
          <td>
            <div class="action-buttons">
              <button 
                class="btn-action edit" 
                title="Edit Product" 
                data-action="edit" 
                data-id="${escapeHtml(product.id)}"
                aria-label="Edit product ${escapeHtml(product.name)}"
              >
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button 
                class="btn-action delete" 
                title="Delete Product" 
                data-action="delete" 
                data-id="${escapeHtml(product.id)}"
                aria-label="Delete product ${escapeHtml(product.name)}"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    productsTableBody.innerHTML = rowsHtml;
  }

  // ==========================================
  // FORM VALIDATION & MODAL ACTIONS
  // ==========================================
  
  function validateForm() {
    let isValid = true;

    // Helper to toggle error
    const setError = (fieldId, errorId, message) => {
      const field = document.getElementById(fieldId);
      const errorSpan = document.getElementById(errorId);
      if (message) {
        field.classList.add('input-error');
        errorSpan.textContent = message;
        errorSpan.classList.add('active');
        isValid = false;
      } else {
        field.classList.remove('input-error');
        errorSpan.textContent = '';
        errorSpan.classList.remove('active');
      }
    };

    // Product Name validation
    const nameVal = productNameInput.value.trim();
    if (!nameVal) {
      setError('productName', 'nameError', 'Product name is required.');
    } else {
      setError('productName', 'nameError', '');
    }

    // Category validation
    const catVal = productCategoryInput.value.trim();
    if (!catVal) {
      setError('productCategory', 'categoryError', 'Category is required.');
    } else {
      setError('productCategory', 'categoryError', '');
    }

    // Quantity validation
    const qtyVal = productQuantityInput.value.trim();
    const qtyNum = Number(qtyVal);
    if (qtyVal === '' || isNaN(qtyNum) || qtyNum < 0 || !Number.isInteger(qtyNum)) {
      setError('productQuantity', 'quantityError', 'Quantity must be a positive whole number.');
    } else {
      setError('productQuantity', 'quantityError', '');
    }

    // Price validation
    const priceVal = productPriceInput.value.trim();
    const priceNum = Number(priceVal);
    if (priceVal === '' || isNaN(priceNum) || priceNum < 0) {
      setError('productPrice', 'priceError', 'Price must be a valid positive amount.');
    } else {
      setError('productPrice', 'priceError', '');
    }

    return isValid;
  }

  function clearFormErrors() {
    ['productName', 'productCategory', 'productQuantity', 'productPrice', 'productDescription'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('input-error');
    });
    ['nameError', 'categoryError', 'quantityError', 'priceError', 'descriptionError'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = '';
        el.classList.remove('active');
      }
    });
  }

  function openAddModal() {
    state.editingProductId = null;
    productForm.reset();
    clearFormErrors();
    productIdInput.value = '';
    modalTitle.textContent = 'Add New Product';
    modalSubtitle.textContent = 'Fill in the details below to add to Supabase inventory';
    modalHeaderIcon.innerHTML = '<i class="fa-solid fa-plus"></i>';
    modalHeaderIcon.style.background = 'var(--primary-light)';
    modalHeaderIcon.style.color = 'var(--primary)';
    saveBtnText.textContent = 'Save Product';
    productModal.classList.remove('hidden');
    productNameInput.focus();
  }

  function openEditModal(product) {
    if (!product) return;
    state.editingProductId = product.id;
    clearFormErrors();
    productIdInput.value = product.id;
    productNameInput.value = product.name || '';
    productCategoryInput.value = product.category || '';
    productQuantityInput.value = product.quantity !== undefined ? product.quantity : '';
    productPriceInput.value = product.price !== undefined ? product.price : '';
    productDescriptionInput.value = product.description || '';

    modalTitle.textContent = 'Edit Product';
    modalSubtitle.textContent = `Modifying product details for SKU #${product.id.substring(0, 8)}...`;
    modalHeaderIcon.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
    modalHeaderIcon.style.background = 'var(--purple-light)';
    modalHeaderIcon.style.color = 'var(--purple)';
    saveBtnText.textContent = 'Update Product';
    productModal.classList.remove('hidden');
    productNameInput.focus();
  }

  function closeProductModal() {
    productModal.classList.add('hidden');
    productForm.reset();
    clearFormErrors();
    state.editingProductId = null;
  }

  // Handle Form Submission (Add or Update)
  async function handleProductFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      name: productNameInput.value.trim(),
      category: productCategoryInput.value.trim(),
      quantity: parseInt(productQuantityInput.value.trim(), 10),
      price: parseFloat(productPriceInput.value.trim()),
      description: productDescriptionInput.value.trim()
    };

    const isEdit = Boolean(state.editingProductId);
    const url = isEdit ? `/products/${state.editingProductId}` : '/products';
    const method = isEdit ? 'PUT' : 'POST';

    // Submit state UI
    state.isSubmitting = true;
    saveProductBtn.disabled = true;
    saveBtnText.textContent = isEdit ? 'Updating...' : 'Saving...';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || (resData.details ? resData.details.join(', ') : 'Operation failed'));
      }

      const savedProduct = resData.data;

      if (isEdit) {
        // Update local state without full reload
        const index = state.products.findIndex(p => p.id === state.editingProductId);
        if (index !== -1) {
          state.products[index] = savedProduct;
        }
        showToast('success', 'Product Updated', `"${savedProduct.name}" has been updated.`);
      } else {
        // Prepend newly added product to list
        state.products.unshift(savedProduct);
        showToast('success', 'Product Added', `"${savedProduct.name}" has been added to Supabase.`);
      }

      closeProductModal();
      updateCategoryDropdown();
      applyFiltersAndSort();
      updateDashboardStats();

    } catch (err) {
      console.error('Save failed:', err);
      showToast('error', isEdit ? 'Update Failed' : 'Save Failed', err.message);
    } finally {
      state.isSubmitting = false;
      saveProductBtn.disabled = false;
      saveBtnText.textContent = isEdit ? 'Update Product' : 'Save Product';
    }
  }

  // ==========================================
  // DELETE PRODUCT LOGIC
  // ==========================================
  function openDeleteModal(product) {
    state.productToDelete = product;
    deleteProductName.textContent = `"${product.name}"`;
    deleteModal.classList.remove('hidden');
    confirmDeleteBtn.focus();
  }

  function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    state.productToDelete = null;
  }

  async function handleConfirmDelete() {
    if (!state.productToDelete) return;

    const { id, name } = state.productToDelete;
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

    try {
      const response = await fetch(`/products/${id}`, {
        method: 'DELETE'
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to delete product');
      }

      // Remove from state array
      state.products = state.products.filter(p => p.id !== id);

      closeDeleteModal();
      updateCategoryDropdown();
      applyFiltersAndSort();
      updateDashboardStats();

      showToast('success', 'Product Deleted', `"${name}" was permanently removed.`);
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('error', 'Delete Failed', err.message);
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> <span>Delete Product</span>';
    }
  }

  // ==========================================
  // CSV EXPORT UTILITY
  // ==========================================
  function exportToCsv() {
    if (state.products.length === 0) {
      showToast('info', 'Export Notice', 'No products available to export.');
      return;
    }

    const headers = ['Product ID', 'Name', 'Category', 'Quantity', 'Price (USD)', 'Total Value', 'Description', 'Date Added'];
    const rows = state.filteredProducts.map(p => {
      const qty = Number(p.quantity) || 0;
      const price = Number(p.price) || 0;
      return [
        `"${p.id || ''}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.category || '').replace(/"/g, '""')}"`,
        qty,
        price.toFixed(2),
        (qty * price).toFixed(2),
        `"${(p.description || '').replace(/"/g, '""')}"`,
        `"${formatDate(p.created_at)}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('success', 'CSV Exported', `Exported ${state.filteredProducts.length} items.`);
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  // Open / Close Modals
  openAddModalBtn.addEventListener('click', openAddModal);
  emptyStateAddBtn.addEventListener('click', openAddModal);
  closeModalBtn.addEventListener('click', closeProductModal);
  cancelModalBtn.addEventListener('click', closeProductModal);
  productForm.addEventListener('submit', handleProductFormSubmit);

  // Delete modal
  closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  // Close modals on background click
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) closeProductModal();
  });
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  // Keyboard shortcut (Escape to close modals)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!productModal.classList.contains('hidden')) closeProductModal();
      if (!deleteModal.classList.contains('hidden')) closeDeleteModal();
    }
  });

  // Table action buttons delegation (Edit / Delete)
  productsTableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const productId = btn.getAttribute('data-id');
    const product = state.products.find(p => p.id === productId);

    if (action === 'edit') {
      openEditModal(product);
    } else if (action === 'delete') {
      openDeleteModal(product);
    }
  });

  // Table header sorting
  document.querySelectorAll('.th-sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-sort');
      if (state.sortField === field) {
        state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortField = field;
        state.sortOrder = 'asc';
      }

      // Update sort icons in headers
      document.querySelectorAll('.th-sortable i').forEach(icon => {
        icon.className = 'fa-solid fa-sort';
      });

      const icon = th.querySelector('i');
      if (icon) {
        icon.className = state.sortOrder === 'asc' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
      }

      applyFiltersAndSort();
    });
  });

  // Search input typing
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    if (state.searchQuery) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    applyFiltersAndSort();
  });

  // Clear search button
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    applyFiltersAndSort();
  });

  // Category dropdown selection
  categoryFilter.addEventListener('change', (e) => {
    state.selectedCategory = e.target.value;
    applyFiltersAndSort();
  });

  // Low Stock filter button toggle
  filterLowStockBtn.addEventListener('click', () => {
    state.lowStockOnly = !state.lowStockOnly;
    filterLowStockBtn.classList.toggle('active', state.lowStockOnly);
    applyFiltersAndSort();
  });

  // Reset all filters
  resetAllFiltersBtn.addEventListener('click', () => {
    state.searchQuery = '';
    state.selectedCategory = 'ALL';
    state.lowStockOnly = false;
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    categoryFilter.value = 'ALL';
    filterLowStockBtn.classList.remove('active');
    applyFiltersAndSort();
  });

  // Export CSV
  exportCsvBtn.addEventListener('click', exportToCsv);

  // Sync / Refresh button
  refreshBtn.addEventListener('click', () => {
    checkServerStatus();
    fetchProducts(true);
  });

  // Sidebar navigation links
  navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    navDashboard.classList.add('active');
    navInventory.classList.remove('active');
    navLowStock.classList.remove('active');
    document.getElementById('dashboardSection').scrollIntoView({ behavior: 'smooth' });
    if (window.innerWidth <= 900) sidebar.classList.remove('open');
  });

  navInventory.addEventListener('click', (e) => {
    e.preventDefault();
    navInventory.classList.add('active');
    navDashboard.classList.remove('active');
    navLowStock.classList.remove('active');
    state.lowStockOnly = false;
    filterLowStockBtn.classList.remove('active');
    applyFiltersAndSort();
    document.getElementById('inventorySection').scrollIntoView({ behavior: 'smooth' });
    if (window.innerWidth <= 900) sidebar.classList.remove('open');
  });

  navLowStock.addEventListener('click', (e) => {
    e.preventDefault();
    navLowStock.classList.add('active');
    navDashboard.classList.remove('active');
    navInventory.classList.remove('active');
    state.lowStockOnly = true;
    filterLowStockBtn.classList.add('active');
    applyFiltersAndSort();
    document.getElementById('inventorySection').scrollIntoView({ behavior: 'smooth' });
    if (window.innerWidth <= 900) sidebar.classList.remove('open');
  });

  // Mobile sidebar drawer toggle
  openSidebarBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
  });

  closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  // Close sidebar on mobile when clicked outside
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 900 && 
        sidebar.classList.contains('open') && 
        !sidebar.contains(e.target) && 
        !openSidebarBtn.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  // ==========================================
  // INITIALIZATION
  // ==========================================
  checkServerStatus();
  fetchProducts(false);
});
