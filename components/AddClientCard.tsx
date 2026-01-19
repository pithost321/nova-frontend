import React, { useState } from 'react';

interface AddClientCardProps {
  onAddClient: (clientData: ClientFormData) => void;
  onCancel: () => void;
}

export interface ClientFormData {
  nom_complet: string;
  telephone: string;
  email: string;
  adresse: string;
  code_postal: string;
  commentaire: string;
  date_visite: string;
  date_creation?: string;
  nom_service: 'commerciale' | 'residentiel' | '';
  statut_service?: string; // Optional because the form doesn't fill it, the handler does
  agentusername?: string; // The agent who added the client
}

const AddClientCard: React.FC<AddClientCardProps> = ({ onAddClient, onCancel }) => {
  const [formData, setFormData] = useState<ClientFormData>({
    nom_complet: '',
    telephone: '',
    email: '',
    adresse: '',
    code_postal: '',
    commentaire: '',
    date_visite: '',
    date_creation: '',
    nom_service: '',
  });

  const [errors, setErrors] = useState<Partial<ClientFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<ClientFormData> = {};

    // Nom complet validation
    if (!formData.nom_complet.trim()) {
      newErrors.nom_complet = 'Le nom complet est requis';
    }

    // Telephone validation (US format: +1XXXXXXXXXX, only digits after +1)
    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le numéro de téléphone est requis';
    } else if (!/^\d{10}$/.test(formData.telephone)) {
      newErrors.telephone = 'Format: 10 chiffres (ex: 1234567890)';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    // Adresse validation
    if (!formData.adresse.trim()) {
      newErrors.adresse = 'L\'adresse est requise';
    }

    // Code postal validation
    if (!formData.code_postal.trim()) {
      newErrors.code_postal = 'Le code postal est requis';
    }

    // nom_service validation
    if (!formData.nom_service) {
      (newErrors as any).nom_service = 'Le type de service est requis';
    }

    // Commentaire validation
    if (!formData.commentaire.trim()) {
      newErrors.commentaire = 'Le commentaire est requis';
    }

    // Date de visite validation
    if (!formData.date_visite.trim()) {
      newErrors.date_visite = 'La date de visite est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);

  try {
    // Get agent username from localStorage (set during login)
    const agentusername = localStorage.getItem('userEmail') || 'Unknown';
    
    // Add agentusername to form data and prepend "1" to phone number
    const formDataWithAgent = {
      ...formData,
      telephone: '1' + formData.telephone, // Store as "15144316137" format
      agentusername,
    };

    // 1️⃣ Send form data to n8n webhook
    await fetch("https://novaecoclean.app.n8n.cloud/webhook/9c6ffd2d-765f-4b09-b630-ae7399974f47", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formDataWithAgent),
    });

    // 2️⃣ Call local onAddClient logic
    await onAddClient(formDataWithAgent);

    // 3️⃣ Reset form after successful submission
    setFormData({
      nom_complet: '',
      telephone: '',
      email: '',
      adresse: '',
      code_postal: '',
      commentaire: '',
      date_visite: '',
      nom_service: '',
    });
    setErrors({});
  } catch (error) {
    console.error('Erreur lors de l\'envoi du formulaire:', error);
  } finally {
    setIsSubmitting(false);
  }
};


  const handleChange = (field: keyof ClientFormData, value: string) => {
    let newValue = value;
    if (field === 'telephone') {
      // Remove all non-digits
      let digitsOnly = value.replace(/[^\d]/g, '');
      
      // Handle both 10-digit and 11-digit formats
      if (digitsOnly.length >= 10) {
        // If 11 digits starting with 1, remove the leading 1
        if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
          digitsOnly = digitsOnly.substring(1);
        }
        // Keep only the first 10 digits
        newValue = digitsOnly.slice(0, 10);
      } else {
        newValue = digitsOnly;
      }
    }
    setFormData({ ...formData, [field]: newValue });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <span className="w-2 h-8 bg-blue-600 rounded-full block"></span>
          Ajouter un Client
        </h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          type="button"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nom Service Dropdown */}
                <div>
                  <label htmlFor="nom_service" className="block text-sm font-bold text-slate-700 mb-2">
                    Type de Service <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="nom_service"
                    value={formData.nom_service}
                    onChange={e => handleChange('nom_service', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.nom_service ? 'border-red-500' : 'border-slate-200'}`}
                    disabled={isSubmitting}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="commerciale">Commerciale</option>
                    <option value="residentiel">Résidentiel</option>
                  </select>
                  {errors.nom_service && <p className="mt-1 text-sm text-red-600">{errors.nom_service}</p>}
                </div>
        {/* Nom Complet */}
        <div>
          <label htmlFor="nom_complet" className="block text-sm font-bold text-slate-700 mb-2">
            Nom Complet <span className="text-red-500">*</span>
          </label>
          <input
            id="nom_complet"
            type="text"
            value={formData.nom_complet}
            onChange={(e) => handleChange('nom_complet', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.nom_complet ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="Jean Dupont"
            disabled={isSubmitting}
          />
          {errors.nom_complet && <p className="mt-1 text-sm text-red-600">{errors.nom_complet}</p>}
        </div>

        {/* Telephone */}
        <div>
          <label htmlFor="telephone" className="block text-sm font-bold text-slate-700 mb-2">
            Numéro de Téléphone <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-xl border-2 border-r-0 border-slate-200 bg-slate-50 text-slate-500 select-none">
              +1
            </span>
            <input
              id="telephone"
              type="tel"
              value={formData.telephone}
              onChange={(e) => handleChange('telephone', e.target.value)}
              className={`w-full px-4 py-3 border-2 border-l-0 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.telephone ? 'border-red-500' : 'border-slate-200'
              }`}
              placeholder="5149465227"
              maxLength={10}
              disabled={isSubmitting}
            />
          </div>
          {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.email ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="jean.dupont@example.com"
            disabled={isSubmitting}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        {/* Adresse */}
        <div>
          <label htmlFor="adresse" className="block text-sm font-bold text-slate-700 mb-2">
            Adresse <span className="text-red-500">*</span>
          </label>
          <input
            id="adresse"
            type="text"
            value={formData.adresse}
            onChange={(e) => handleChange('adresse', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.adresse ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="123 Rue de la République"
            disabled={isSubmitting}
          />
          {errors.adresse && <p className="mt-1 text-sm text-red-600">{errors.adresse}</p>}
        </div>

        {/* Code Postal */}
        <div>
          <label htmlFor="code_postal" className="block text-sm font-bold text-slate-700 mb-2">
            Code Postal <span className="text-red-500">*</span>
          </label>
          <input
            id="code_postal"
            type="text"
            value={formData.code_postal}
            onChange={(e) => handleChange('code_postal', e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.code_postal ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="H2X 1X5"
            disabled={isSubmitting}
          />
          {errors.code_postal && <p className="mt-1 text-sm text-red-600">{errors.code_postal}</p>}
        </div>

        {/* Commentaire */}
        <div>
          <label htmlFor="commentaire" className="block text-sm font-bold text-slate-700 mb-2">
            Commentaire <span className="text-red-500">*</span>
          </label>
          <textarea
            id="commentaire"
            value={formData.commentaire}
            onChange={(e) => handleChange('commentaire', e.target.value)}
            rows={4}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
              errors.commentaire ? 'border-red-500' : 'border-slate-200'
            }`}
            placeholder="interval horaire : ex (du 15:00 - 18:00)"
            disabled={isSubmitting}
          />
          {errors.commentaire && <p className="mt-1 text-sm text-red-600">{errors.commentaire}</p>}
        </div>

        {/* Date de Visite */}
        <div>
          <label htmlFor="date_visite" className="block text-sm font-bold text-slate-700 mb-2">
            Date de Visite <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              id="date_visite"
              type="datetime-local"
              value={formData.date_visite}
              onChange={(e) => handleChange('date_visite', e.target.value)}
              className={`flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.date_visite ? 'border-red-500' : 'border-slate-200'
              }`}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => window.open('https://silver-biscochitos-445001.netlify.app/', '_blank', 'width=1200,height=800')}
              className="px-4 py-3 border-2 border-slate-200 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              disabled={isSubmitting}
            >
              Best Date
            </button>
          </div>
          {errors.date_visite && <p className="mt-1 text-sm text-red-600">{errors.date_visite}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Ajout en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter le Client
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-8 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddClientCard;
