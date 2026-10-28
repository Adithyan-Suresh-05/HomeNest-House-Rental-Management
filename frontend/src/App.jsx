
import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api/properties';
const SERVER_URL = 'http://localhost:5000';

function getImageUrl(imageUrl) {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('/uploads/')) {
    return `${SERVER_URL}${imageUrl}`;
  }
  return imageUrl;
}

const emptyForm = {
  title: '',
  location: '',
  rent: '',
  bedrooms: '',
  propertyType: 'Apartment',
  description: '',
  available: true,
  tenantName: '',
};

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;

function App() {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vacatingId, setVacatingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  // Load properties from MongoDB through the Express API
  async function loadProperties() {
    try {
      setError('');

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Could not load properties.');
      }

      const data = await response.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message ||
          'Unable to connect to the server. Make sure the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  // Dashboard statistics
  const availableCount = properties.filter(
    (property) => property.available
  ).length;

  const occupiedCount = properties.length - availableCount;

  const totalMonthlyRent = properties.reduce(
    (total, property) =>
      total +
      (property.available ? 0 : Number(property.rent || 0)),
    0
  );

  const averageRent = properties.length
    ? Math.round(
        properties.reduce(
          (total, property) =>
            total + Number(property.rent || 0),
          0
        ) / properties.length
      )
    : 0;

  // Search, filter and sort properties
  const filteredProperties = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = properties.filter((property) => {
      const matchesSearch =
        (property.title || '').toLowerCase().includes(term) ||
        (property.location || '').toLowerCase().includes(term) ||
        String(property.rent ?? '').includes(term) ||
        (property.propertyType || '').toLowerCase().includes(term);

      const matchesType =
        typeFilter === 'All' ||
        property.propertyType === typeFilter;

      const matchesAvailability =
        availabilityFilter === 'All' ||
        (availabilityFilter === 'Available' &&
          property.available) ||
        (availabilityFilter === 'Rented' &&
          !property.available);

      return (
        matchesSearch &&
        matchesType &&
        matchesAvailability
      );
    });

    return filtered.sort((a, b) => {
      if (sortOrder === 'rent-low') {
        return Number(a.rent || 0) - Number(b.rent || 0);
      }

      if (sortOrder === 'rent-high') {
        return Number(b.rent || 0) - Number(a.rent || 0);
      }

      return (
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
      );
    });
  }, [
    properties,
    searchTerm,
    typeFilter,
    availabilityFilter,
    sortOrder,
  ]);

  // Handle form fields
  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  // Open the Add Property form
  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setSelectedImage(null);
    setImagePreview('');
    setError('');
    setMessage('');
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Open the Edit Property form
  function openEditForm(property) {
    setEditingId(property._id);

    setForm({
      title: property.title || '',
      location: property.location || '',
      rent: String(property.rent ?? ''),
      bedrooms: String(property.bedrooms ?? ''),
      propertyType: property.propertyType || 'Apartment',
      description: property.description || '',
      available: Boolean(property.available),
      tenantName: property.tenantName || '',
    });

    setSelectedImage(null);
    setImagePreview(getImageUrl(property.imageUrl));
    setError('');
    setMessage('');
    setShowForm(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Close and reset the form
  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setSelectedImage(null);
    setImagePreview('');
    setError('');
  }

  // Validate uploaded images and show a preview
  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        'Please choose a JPG, PNG, WebP, or GIF image.'
      );
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }

    setError('');
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  // Create or update a property
  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError('');
    setMessage('');

    const wasEditing = Boolean(editingId);
    const payload = new FormData();

    payload.append('title', form.title.trim());
    payload.append('location', form.location.trim());
    payload.append(
      'rent',
      String(Math.round(Number(form.rent)))
    );
    payload.append(
      'bedrooms',
      String(Math.round(Number(form.bedrooms)))
    );
    payload.append('propertyType', form.propertyType);
    payload.append('description', form.description.trim());
    payload.append('available', String(form.available));
    payload.append(
      'tenantName',
      form.available ? '' : form.tenantName.trim()
    );

    if (selectedImage) {
      payload.append('image', selectedImage);
    }

    try {
      const response = await fetch(
        wasEditing
          ? `${API_URL}/${editingId}`
          : API_URL,
        {
          method: wasEditing ? 'PUT' : 'POST',
          body: payload,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'Could not save property.'
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      setSelectedImage(null);
      setImagePreview('');

      setMessage(
        wasEditing
          ? 'Property updated successfully!'
          : 'Property added successfully!'
      );

      await loadProperties();
    } catch (err) {
      setError(err.message || 'Could not save property.');
    } finally {
      setSaving(false);
    }
  }

  // Delete a property
  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this property? This action cannot be undone.'
    );

    if (!confirmed) return;

    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'Could not delete property.'
        );
      }

      setMessage('Property deleted successfully!');
      await loadProperties();
    } catch (err) {
      setError(err.message || 'Could not delete property.');
    }
  }

  // Record a tenant's departure and mark the property available
  async function handleVacate(property) {
    const confirmed = window.confirm(
      `Record that the tenant has vacated "${property.title}" and make it available for rent?`
    );

    if (!confirmed) return;

    setVacatingId(property._id);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `${API_URL}/${property._id}/vacate`,
        { method: 'PATCH' }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'Could not vacate this property.'
        );
      }

      setMessage(
        result.message || 'House vacated successfully.'
      );

      await loadProperties();
    } catch (err) {
      setError(
        err.message || 'Could not vacate this property.'
      );
    } finally {
      setVacatingId(null);
    }
  }

  // Clear search and filters
  function clearFilters() {
    setSearchTerm('');
    setTypeFilter('All');
    setAvailabilityFilter('All');
    setSortOrder('newest');
  }

  // Navigate to the property listings
  function jumpToListings() {
    document
      .getElementById('property-listings')
      ?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="hn-app-shell" id="top">
      {/* Sidebar */}
      <aside className="hn-sidebar">
        <a
          className="hn-brand"
          href="#top"
          aria-label="HomeNest dashboard home"
        >
          <span className="hn-brand-icon">
            <i className="bi bi-house-heart-fill" />
          </span>

          <span>
            <strong>HomeNest</strong>
            <small>PROPERTY MANAGER</small>
          </span>
        </a>

        <div className="hn-nav-label">WORKSPACE</div>

        <nav
          className="hn-sidebar-nav"
          aria-label="Main navigation"
        >
          <button
            className="hn-nav-item active"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              })
            }
          >
            <i className="bi bi-grid-1x2-fill" />
            <span>Dashboard</span>
          </button>

          <button
            className="hn-nav-item"
            onClick={jumpToListings}
          >
            <i className="bi bi-buildings" />
            <span>Properties</span>
            <span className="hn-nav-count">
              {properties.length}
            </span>
          </button>

          <button
            className="hn-nav-item"
            onClick={() => {
              setAvailabilityFilter('Available');
              jumpToListings();
            }}
          >
            <i className="bi bi-key" />
            <span>Available rentals</span>
          </button>

          <button
            className="hn-nav-item"
            onClick={() => {
              setAvailabilityFilter('Rented');
              jumpToListings();
            }}
          >
            <i className="bi bi-person-check" />
            <span>Occupied properties</span>
          </button>
        </nav>

        <div className="hn-sidebar-bottom">
          <div className="hn-sidebar-help-icon">
            <i className="bi bi-stars" />
          </div>

          <strong>Keep your rentals organised</strong>

          <p>
            Manage property details, availability and tenant
            move-outs in one place.
          </p>

          <button
            className="hn-help-button"
            onClick={openAddForm}
          >
            <i className="bi bi-plus-lg me-2" />
            Add a property
          </button>
        </div>

        <div className="hn-sidebar-footer">
          <span className="hn-status-dot" />
          System connected locally
        </div>
      </aside>

      {/* Main dashboard */}
      <div className="hn-main-column">
        <header className="hn-topbar">
          <div className="hn-breadcrumb">
            <span>Workspace</span>
            <i className="bi bi-chevron-right" />
            <strong>Dashboard</strong>
          </div>

          <div className="hn-topbar-right">
            <span className="hn-date-label">
              <i className="bi bi-calendar3 me-2" />
              Rental overview
            </span>

            <div
              className="hn-avatar"
              aria-label="HomeNest manager"
            >
              HN
            </div>
          </div>
        </header>

        <main className="hn-main-content">
          {/* Welcome header */}
          <section className="hn-welcome-row">
            <div>
              <div className="hn-eyebrow">
                <span className="hn-eyebrow-line" />
                PROPERTY MANAGEMENT
              </div>

              <h1>Good day. Here's your overview.</h1>

              <p>
                Keep track of your rental properties,
                availability and monthly rental value.
              </p>
            </div>

            <button
              className="btn btn-primary hn-primary-action"
              onClick={openAddForm}
            >
              <i className="bi bi-plus-lg me-2" />
              Add new property
            </button>
          </section>

          {/* Success message */}
          {message && (
            <div
              className="alert alert-success hn-alert"
              role="status"
            >
              <i className="bi bi-check-circle-fill me-2" />
              {message}

              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setMessage('')}
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div
              className="alert alert-danger hn-alert"
              role="alert"
            >
              <i className="bi bi-exclamation-triangle-fill me-2" />
              {error}

              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setError('')}
              />
            </div>
          )}

          {/* Dashboard statistics */}
          <section
            className="hn-stats-grid"
            aria-label="Property statistics"
          >
            <article className="hn-stat-card">
              <div className="hn-stat-top">
                <span className="hn-stat-icon icon-blue">
                  <i className="bi bi-buildings-fill" />
                </span>
                <span className="hn-stat-tag">PORTFOLIO</span>
              </div>

              <div className="hn-stat-label">
                Total properties
              </div>

              <div className="hn-stat-value">
                {properties.length}
              </div>

              <div className="hn-stat-foot">
                <i className="bi bi-collection me-1" />
                All listings in your portfolio
              </div>
            </article>

            <article className="hn-stat-card">
              <div className="hn-stat-top">
                <span className="hn-stat-icon icon-green">
                  <i className="bi bi-house-check-fill" />
                </span>
                <span className="hn-stat-tag">
                  READY TO RENT
                </span>
              </div>

              <div className="hn-stat-label">
                Available properties
              </div>

              <div className="hn-stat-value">
                {availableCount}
              </div>

              <div className="hn-stat-foot">
                <i className="bi bi-check-circle me-1" />
                Currently open for rent
              </div>
            </article>

            <article className="hn-stat-card">
              <div className="hn-stat-top">
                <span className="hn-stat-icon icon-orange">
                  <i className="bi bi-person-fill-check" />
                </span>
                <span className="hn-stat-tag">
                  OCCUPANCY
                </span>
              </div>

              <div className="hn-stat-label">
                Occupied properties
              </div>

              <div className="hn-stat-value">
                {occupiedCount}
              </div>

              <div className="hn-stat-foot">
                <i className="bi bi-house-door me-1" />
                Properties with tenants
              </div>
            </article>

            <article className="hn-stat-card">
              <div className="hn-stat-top">
                <span className="hn-stat-icon icon-purple">
                  <i className="bi bi-currency-rupee" />
                </span>
                <span className="hn-stat-tag">MONTHLY</span>
              </div>

              <div className="hn-stat-label">
                Occupied rental value
              </div>

              <div className="hn-stat-value hn-stat-currency">
                {currency(totalMonthlyRent)}
              </div>

              <div className="hn-stat-foot">
                <i className="bi bi-graph-up-arrow me-1" />
                Sum of rents for occupied homes
              </div>
            </article>
          </section>

          {/* Portfolio summary */}
          <section className="hn-insight-strip">
            <div className="hn-insight-mark">
              <i className="bi bi-lightbulb-fill" />
            </div>

            <div className="hn-insight-copy">
              <strong>Portfolio snapshot</strong>

              <span>
                {properties.length
                  ? `${availableCount} of ${properties.length} properties are currently available. Average listed rent is ${currency(averageRent)} per month.`
                  : 'Add your first property to start building your rental portfolio.'}
              </span>
            </div>

            <button
              className="hn-text-button"
              onClick={jumpToListings}
            >
              View listings
              <i className="bi bi-arrow-right ms-1" />
            </button>
          </section>

          {/* Add / Edit Property form */}
          {showForm && (
            <section
              className="hn-form-panel"
              id="property-form"
            >
              <div className="hn-panel-heading">
                <div className="hn-panel-title-icon">
                  <i
                    className={`bi ${
                      editingId
                        ? 'bi-pencil-square'
                        : 'bi-house-add-fill'
                    }`}
                  />
                </div>

                <div>
                  <h2>
                    {editingId
                      ? 'Edit property'
                      : 'Add a new property'}
                  </h2>

                  <p>
                    {editingId
                      ? 'Update the listing details below.'
                      : 'Enter the details to add a rental to your portfolio.'}
                  </p>
                </div>

                <button
                  className="hn-close-button"
                  type="button"
                  onClick={closeForm}
                  aria-label="Close property form"
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label
                      className="form-label"
                      htmlFor="title"
                    >
                      Property title{' '}
                      <span className="text-danger">*</span>
                    </label>

                    <input
                      id="title"
                      className="form-control"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. Spacious 2BHK Apartment"
                      required
                      maxLength={120}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      className="form-label"
                      htmlFor="location"
                    >
                      Address / location{' '}
                      <span className="text-danger">*</span>
                    </label>

                    <input
                      id="location"
                      className="form-control"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="e.g. Coimbatore"
                      required
                      maxLength={150}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      className="form-label"
                      htmlFor="rent"
                    >
                      Monthly rent (₹){' '}
                      <span className="text-danger">*</span>
                    </label>

                    <input
                      id="rent"
                      className="form-control"
                      type="number"
                      name="rent"
                      value={form.rent}
                      onChange={handleChange}
                      placeholder="15000"
                      min="0"
                      step="1"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      className="form-label"
                      htmlFor="bedrooms"
                    >
                      Bedrooms{' '}
                      <span className="text-danger">*</span>
                    </label>

                    <input
                      id="bedrooms"
                      className="form-control"
                      type="number"
                      name="bedrooms"
                      value={form.bedrooms}
                      onChange={handleChange}
                      placeholder="2"
                      min="0"
                      step="1"
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label
                      className="form-label"
                      htmlFor="propertyType"
                    >
                      Property type{' '}
                      <span className="text-danger">*</span>
                    </label>

                    <select
                      id="propertyType"
                      className="form-select"
                      name="propertyType"
                      value={form.propertyType}
                      onChange={handleChange}
                      required
                    >
                      <option value="Apartment">
                        Apartment
                      </option>
                      <option value="House">House</option>
                      <option value="Villa">Villa</option>
                      <option value="Room">Room</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label d-block">
                      Availability
                    </label>

                    <label className="hn-availability-toggle">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="available"
                        checked={form.available}
                        onChange={handleChange}
                      />

                      <span>
                        <strong>
                          {form.available
                            ? 'Available for rent'
                            : 'Currently occupied'}
                        </strong>

                        <small>
                          {form.available
                            ? 'This property can be rented.'
                            : 'This property currently has a tenant.'}
                        </small>
                      </span>
                    </label>
                  </div>

                  {!form.available && (
                    <div className="col-12 col-md-6">
                      <label
                        className="form-label"
                        htmlFor="tenantName"
                      >
                        Current tenant name
                      </label>

                      <input
                        id="tenantName"
                        className="form-control"
                        name="tenantName"
                        value={form.tenantName}
                        onChange={handleChange}
                        placeholder="Enter tenant name"
                        maxLength={120}
                      />
                    </div>
                  )}

                  <div className="col-12">
                    <label
                      className="form-label"
                      htmlFor="description"
                    >
                      Property description
                    </label>

                    <textarea
                      id="description"
                      className="form-control"
                      name="description"
                      rows="3"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe the property, amenities or nearby facilities..."
                      maxLength={1000}
                    />
                  </div>

                  {/* Image upload */}
                  <div className="col-12">
                    <label
                      className="form-label"
                      htmlFor="propertyImage"
                    >
                      Property photo
                    </label>

                    <div className="hn-upload-box">
                      <div className="hn-upload-icon">
                        <i className="bi bi-cloud-arrow-up-fill" />
                      </div>

                      <div className="hn-upload-copy">
                        <strong>Choose a property image</strong>
                        <span>
                          JPG, PNG, WebP or GIF · Maximum 5 MB
                        </span>
                      </div>

                      <input
                        id="propertyImage"
                        type="file"
                        className="form-control"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageChange}
                      />
                    </div>

                    {imagePreview && (
                      <div className="hn-image-preview-wrap">
                        <img
                          src={imagePreview}
                          alt="Property preview"
                          className="hn-image-preview"
                        />

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setSelectedImage(null);

                            setImagePreview(
                              editingId
                                ? getImageUrl(
                                    properties.find(
                                      (property) =>
                                        property._id === editingId
                                    )?.imageUrl
                                  )
                                : ''
                            );

                            const input =
                              document.getElementById(
                                'propertyImage'
                              );

                            if (input) input.value = '';
                          }}
                        >
                          Cancel image selection
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="hn-form-actions">
                  <button
                    className="btn btn-primary hn-primary-action"
                    type="submit"
                    disabled={saving}
                  >
                    <i
                      className={`bi ${
                        saving
                          ? 'bi-hourglass-split'
                          : 'bi-check2-circle'
                      } me-2`}
                    />

                    {saving
                      ? 'Saving property...'
                      : editingId
                        ? 'Save changes'
                        : 'Add property'}
                  </button>

                  <button
                    className="btn btn-light hn-secondary-action"
                    type="button"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Property listings */}
          <section
            className="hn-listings-section"
            id="property-listings"
          >
            <div className="hn-section-heading">
              <div>
                <div className="hn-eyebrow">
                  <span className="hn-eyebrow-line" />
                  YOUR PORTFOLIO
                </div>

                <h2>Property listings</h2>

                <p>
                  Search, filter and manage all your rental
                  properties.
                </p>
              </div>

              <div className="hn-listing-count">
                <strong>{filteredProperties.length}</strong>
                <span>
                  {filteredProperties.length === 1
                    ? 'listing'
                    : 'listings'}{' '}
                  shown
                </span>
              </div>
            </div>

            {/* Search, filters and sorting */}
            <div className="hn-filter-panel">
              <div className="hn-search-field">
                <i className="bi bi-search" />

                <input
                  type="search"
                  aria-label="Search properties"
                  placeholder="Search by name, location, type or rent..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />
              </div>

              <div className="hn-filter-control">
                <label htmlFor="typeFilter">
                  Property type
                </label>

                <select
                  id="typeFilter"
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(event.target.value)
                  }
                >
                  <option value="All">All types</option>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Villa">Villa</option>
                  <option value="Room">Room</option>
                </select>
              </div>

              <div className="hn-filter-control">
                <label htmlFor="availabilityFilter">
                  Availability
                </label>

                <select
                  id="availabilityFilter"
                  value={availabilityFilter}
                  onChange={(event) =>
                    setAvailabilityFilter(event.target.value)
                  }
                >
                  <option value="All">All properties</option>
                  <option value="Available">Available</option>
                  <option value="Rented">Occupied</option>
                </select>
              </div>

              <div className="hn-filter-control hn-sort-control">
                <label htmlFor="sortOrder">Sort by</label>

                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value)
                  }
                >
                  <option value="newest">Newest first</option>
                  <option value="rent-low">
                    Rent: low to high
                  </option>
                  <option value="rent-high">
                    Rent: high to low
                  </option>
                </select>
              </div>

              <button
                className="hn-reset-button"
                type="button"
                onClick={clearFilters}
              >
                <i className="bi bi-arrow-counterclockwise me-1" />
                Reset
              </button>
            </div>

            {/* Loading indicator */}
            {loading && (
              <div className="hn-loading-state">
                <div
                  className="spinner-border text-primary"
                  role="status"
                >
                  <span className="visually-hidden">
                    Loading...
                  </span>
                </div>

                <strong>Loading your properties</strong>

                <span>
                  Connecting to your rental database...
                </span>
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredProperties.length === 0 && (
              <div className="hn-empty-state">
                <div className="hn-empty-icon">
                  <i className="bi bi-houses-fill" />
                </div>

                <h3>
                  {properties.length === 0
                    ? 'Your portfolio starts here'
                    : 'No matching properties'}
                </h3>

                <p>
                  {properties.length === 0
                    ? 'Add your first rental property to begin managing your portfolio.'
                    : 'Try a different search term or adjust your filters.'}
                </p>

                {properties.length === 0 ? (
                  <button
                    className="btn btn-primary hn-primary-action"
                    onClick={openAddForm}
                  >
                    <i className="bi bi-plus-lg me-2" />
                    Add your first property
                  </button>
                ) : (
                  <button
                    className="btn btn-outline-primary"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Property cards */}
            {!loading && filteredProperties.length > 0 && (
              <div className="hn-property-grid">
                {filteredProperties.map((property) => (
                  <article
                    className="hn-property-card"
                    key={property._id}
                  >
                    <div className="hn-property-photo">
                      {property.imageUrl ? (
                        <img
                          src={getImageUrl(property.imageUrl)}
                          alt={property.title}
                          onError={(event) => {
                            event.currentTarget.style.display =
                              'none';

                            const fallback =
                              event.currentTarget.parentElement
                                ?.querySelector('.hn-photo-fallback');

                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}

                      <div
                        className="hn-photo-fallback"
                        style={{
                          display: property.imageUrl
                            ? 'none'
                            : 'flex',
                        }}
                      >
                        <i className="bi bi-house-heart-fill" />
                        <span>No photo available</span>
                      </div>

                      <span
                        className={`hn-property-status ${
                          property.available
                            ? 'is-available'
                            : 'is-occupied'
                        }`}
                      >
                        <span />
                        {property.available
                          ? 'Available'
                          : 'Occupied'}
                      </span>

                      <span className="hn-property-type">
                        {property.propertyType || 'Property'}
                      </span>
                    </div>

                    <div className="hn-property-body">
                      <div className="hn-property-title-row">
                        <h3>{property.title}</h3>

                        <button
                          className="hn-icon-button"
                          type="button"
                          onClick={() =>
                            openEditForm(property)
                          }
                          aria-label={`Edit ${property.title}`}
                          title="Edit property"
                        >
                          <i className="bi bi-pencil-square" />
                        </button>
                      </div>

                      <div className="hn-property-location">
                        <i className="bi bi-geo-alt-fill" />
                        <span>{property.location}</span>
                      </div>

                      <div className="hn-property-price">
                        {currency(property.rent)}
                        <span> / month</span>
                      </div>

                      <div className="hn-property-meta">
                        <span>
                          <i className="bi bi-door-open" />{' '}
                          {property.bedrooms}{' '}
                          {Number(property.bedrooms) === 1
                            ? 'bedroom'
                            : 'bedrooms'}
                        </span>

                        <span>
                          <i className="bi bi-house" />{' '}
                          {property.propertyType}
                        </span>
                      </div>

                      <p className="hn-property-description">
                        {property.description ||
                          'No description provided for this property.'}
                      </p>

                      {!property.available &&
                        property.tenantName && (
                          <div className="hn-tenant-note">
                            <i className="bi bi-person-fill" />
                            <span>
                              Tenant:{' '}
                              <strong>
                                {property.tenantName}
                              </strong>
                            </span>
                          </div>
                        )}

                      {property.vacatedAt && (
                        <div className="hn-vacated-note">
                          <i className="bi bi-calendar-check" />
                          Last vacated{' '}
                          {new Date(
                            property.vacatedAt
                          ).toLocaleDateString('en-IN')}
                        </div>
                      )}

                      <div className="hn-property-actions">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() =>
                            openEditForm(property)
                          }
                        >
                          <i className="bi bi-pencil me-1" />
                          Edit
                        </button>

                        {!property.available && (
                          <button
                            type="button"
                            className="btn btn-outline-success"
                            onClick={() =>
                              handleVacate(property)
                            }
                            disabled={
                              vacatingId === property._id
                            }
                          >
                            <i className="bi bi-house-check me-1" />
                            {vacatingId === property._id
                              ? 'Vacating...'
                              : 'Vacate'}
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() =>
                            handleDelete(property._id)
                          }
                        >
                          <i className="bi bi-trash3 me-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="hn-page-footer">
            <span>
              © {new Date().getFullYear()} HomeNest
            </span>

            <span>
              House Rental Management System
              <span className="hn-footer-separator"> · </span>
              Built for easier property management
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
