import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Mic, MicOff, Search, User, MapPin, Ruler, Sprout, Shield, Wallet,
  Droplets, CheckCircle2, XCircle, AlertCircle, FileText, ChevronDown,
  Loader2, Sparkles, Quote, ClipboardList, Clock, Globe, Download, Volume2, VolumeX
} from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { getSchemes, getProfiles, createProfile, checkEligibility, processVoice } from '../services/api';
import { useToast } from '../context/ToastContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const indianStates = {
  // ── 28 States ────────────────────────────
  "Andhra Pradesh": ["Alluri Sitharama Raju", "Anakapalli", "Anantapur", "Annamayya", "Bapatla", "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur", "Kakinada", "Kurnool", "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam", "Prakasam", "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "Y.S.R. Kadapa"],
  "Arunachal Pradesh": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Itanagar Capital Complex", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
  "Assam": ["Bajali", "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup Metropolitan", "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tamulpur", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran (Motihari)", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur (Bhabua)", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger (Monghyr)", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia (Purnea)", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada (South Bastar)", "Dhamtari", "Durg", "Gariyaband", "Gaurela Pendra Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham (Kawardha)", "Kanker (North Bastar)", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti", "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Narmadapuram", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahilyanagar (Ahmednagar)", "Akola", "Amravati", "Chhatrapati Sambhajinagar", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Dharashiv (Osmanabad)", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "Eastern West Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"],
  "Nagaland": ["Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tseminyu", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghapur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar (Keonjhar)", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur (Sonepur)", "Sundargarh"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Muktsar", "Nawanshahr (Shahid Bhagat Singh Nagar)", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Anoopgarh", "Balotra", "Banswara", "Baran", "Barmer", "Beawar", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Deeg", "Dholpur", "Didwana-Kuchaman", "Dudu", "Dungarpur", "Gangapurcity", "Hanumangarh", "Jaipur Rural", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur Rural", "Jodhpur", "Karauli", "Kekri", "Khairthal-Tijara", "Kota", "Kotputli-Behror", "Nagaur", "Neem Ka Thana", "Pali", "Phalodi", "Pratapgarh", "Rajsamand", "Salumbar", "Sanchore", "Sawai Madhopur", "Shahpura", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim (Gangtok)", "North Sikkim (Mangan)", "Pakyong", "Soreng", "South Sikkim (Namchi)", "West Sikkim (Gyalshing)"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi (Chatrapati Sahuji Mahraj Nagar)", "Amroha (J.P. Nagar)", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur (Panchsheel Nagar)", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar (Padrauna)", "Lakhimpur - Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal (Bhim Nagar)", "Sant Kabir Nagar", "Shahjahanpur", "Shamali (Prabuddh Nagar)", "Shravasti", "Siddharth Nagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],

  // ── 8 Union Territories ──────────────────
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  "Ladakh": ["Kargil", "Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
};

/* ── Voice Input Section ────────────────── */
function VoiceInput({ onProfileExtracted }) {
  const { isListening, transcript, error: voiceError, startListening, stopListening, resetTranscript } = useVoice();
  const [processing, setProcessing] = useState(false);
  const { addToast } = useToast();

  const handleStop = async () => {
    setProcessing(true);
    try {
      const profile = await stopListening();
      if (profile) {
        onProfileExtracted(profile);
        addToast('Voice Processed', 'Extracted farmer profile from audio source', 'success');
      }
    } catch (e) {
      console.error('Voice processing error:', e);
      addToast('Voice Processing Failed', e.message || 'Could not infer profile from audio', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{ padding: '28px', marginBottom: '24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Mic size={20} style={{ color: 'var(--accent-indigo)' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Voice Input</h3>
        <span className="badge badge-info">AI Powered</span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Speak in English or Hindi — <em>"I am Ramesh from Maharashtra, I have 2 acres of wheat land..."</em>
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={isListening ? handleStop : startListening}
          disabled={processing}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: processing ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
            background: isListening ? 'rgba(244, 63, 94, 0.15)' : 'var(--gradient-primary)',
            color: isListening ? 'var(--accent-rose)' : 'white',
            boxShadow: isListening ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.3)',
            opacity: processing ? 0.7 : 1,
          }}
        >
          {processing ? (
            <><Loader2 size={18} className="spin" /> Transcribing Audio...</>
          ) : isListening ? (
            <><MicOff size={18} /> Stop & Process</>
          ) : (
            <><Mic size={18} /> Start Speaking</>
          )}
        </motion.button>
      </div>

      {isListening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
        >
          <div className="pulse-dot" style={{ background: 'var(--accent-rose)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: 500 }}>Recording... click Stop when finished</span>
        </motion.div>
      )}

      {transcript && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            padding: '16px', borderRadius: '12px',
            background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
          }}
        >
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>TRANSCRIPT FROM WHISPER AI</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{transcript}</p>
        </motion.div>
      )}

      {voiceError && (
        <p style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', marginTop: '8px' }}>
          <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} /> {voiceError}
        </p>
      )}
    </motion.div>
  );
}

/* ── Profile Form ───────────────────────── */
function ProfileForm({ initialData, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: '', age: '', state: '', district: '', landHolding: '',
    cropType: '', category: 'General', annualIncome: '', hasIrrigationAccess: false,
  });

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...Object.fromEntries(Object.entries(initialData).filter(([_, v]) => v != null && v !== '')),
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      // If state changes, clear district since the new state might not have the old district
      if (name === 'state') {
        updated.district = '';
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      age: parseInt(form.age) || null,
      landHolding: parseFloat(form.landHolding) || 0,
      annualIncome: parseInt(form.annualIncome) || 0,
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      onSubmit={handleSubmit}
      className="glass-card"
      style={{ padding: '28px', marginBottom: '24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <User size={20} style={{ color: 'var(--accent-violet)' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Farmer Profile</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}><User size={14} /> Full Name</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Ramesh Patil" className="input-dark" required />
        </div>
        <div>
          <label style={labelStyle}><User size={14} /> Age</label>
          <input name="age" type="number" min="18" max="120" value={form.age} onChange={handleChange} placeholder="e.g. 35" className="input-dark" required />
        </div>
        <div>
          <label style={labelStyle}><MapPin size={14} /> State / UT</label>
          <select name="state" value={form.state} onChange={handleChange} className="select-dark" required>
            <option value="">Select State / UT</option>
            {Object.keys(indianStates).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}><MapPin size={14} /> District</label>
          <select 
            name="district" 
            value={form.district} 
            onChange={handleChange} 
            className="select-dark" 
            disabled={!form.state}
          >
            <option value="">Select district</option>
            {form.state && indianStates[form.state] && indianStates[form.state].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}><Ruler size={14} /> Land (acres)</label>
          <input name="landHolding" type="number" step="0.1" value={form.landHolding} onChange={handleChange} placeholder="e.g. 2.5" className="input-dark" required />
        </div>
        <div>
          <label style={labelStyle}><Sprout size={14} /> Crop Type</label>
          <input name="cropType" value={form.cropType} onChange={handleChange} placeholder="e.g. Wheat, Rice" className="input-dark" />
        </div>
        <div>
          <label style={labelStyle}><Shield size={14} /> Category</label>
          <select name="category" value={form.category} onChange={handleChange} className="select-dark">
            <option value="General">General</option>
            <option value="EWS">EWS</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="Minority">Minority</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}><Wallet size={14} /> Annual Income (₹)</label>
          <input name="annualIncome" type="number" value={form.annualIncome} onChange={handleChange} placeholder="e.g. 200000" className="input-dark" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 0' }}>
            <input type="checkbox" name="hasIrrigationAccess" checked={form.hasIrrigationAccess} onChange={handleChange}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-indigo)' }} />
            <span><Droplets size={14} style={{ display: 'inline', marginRight: '4px' }} /> Has Irrigation</span>
          </label>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        className="btn-glow"
        disabled={loading}
        style={{ marginTop: '24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
        {loading ? 'Checking Eligibility...' : 'Check Eligibility'}
      </motion.button>
    </motion.form>
  );
}

const labelStyle = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)',
  marginBottom: '8px',
};

/* ── Proof Card (Result) ────────────────── */
function ProofCard({ result }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    addToast('Generating PDF', 'Preparing your Eligibility Proof Card...', 'info');
    try {
      const element = document.getElementById(`proof-card-${result.scheme.replace(/\s+/g, '-')}`);
      if (!element) return;
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${result.scheme.replace(/\s+/g, '_')}_Eligibility.pdf`);
      addToast('Download Complete', 'Your PDF has been saved successfully', 'success');
    } catch (error) {
      console.error('PDF Generation Failed:', error);
      addToast('Export Failed', 'Could not generate PDF card', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      addToast('Playback Stopped', 'Voice analysis paused', 'info');
    } else {
      const textToSpeak = `AI Analysis results for ${result.scheme}. ${result.reason}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      // Optional customization
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      addToast('Playing Audio', 'Reading AI analysis reasoning...', 'info');
    }
  };

  if (result.error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card"
        style={{ padding: '24px', marginBottom: '16px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <AlertCircle size={24} style={{ color: 'var(--accent-rose)' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{result.scheme}</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{result.error}</p>
      </motion.div>
    );
  }

  const isEligible = result.eligible;

  return (
    <motion.div
      id={`proof-card-${result.scheme.replace(/\s+/g, '-')}`}
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      style={{ marginBottom: '24px' }}
    >
      {/* 1. Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: isEligible ? 'var(--gradient-success)' : 'var(--gradient-danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isEligible ? '0 8px 24px rgba(16,185,129,0.3)' : '0 8px 24px rgba(244,63,94,0.3)',
            }}
          >
            {isEligible ? <CheckCircle2 size={32} color="white" /> : <XCircle size={32} color="white" />}
          </motion.div>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '2px', letterSpacing: '-0.02em', color: isEligible ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {isEligible ? 'Eligible' : 'Not Eligible'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{result.scheme}</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span className={`badge ${isEligible ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                Confidence: {result.confidence}
              </span>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownload}
          disabled={isDownloading}
          className="btn-glass"
          data-html2canvas-ignore="true"
          style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isDownloading ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
          {isDownloading ? 'Exporting...' : 'Download PDF'}
        </motion.button>
      </div>

      {/* 2. AI Decision Summary */}
      <div className="glass-card" style={{ padding: '20px 28px', marginBottom: '20px', borderTop: '4px solid', borderTopColor: isEligible ? 'var(--accent-emerald)' : 'var(--accent-rose)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
            {result.reason}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleSpeech}
          data-html2canvas-ignore="true"
          style={{ 
            background: isSpeaking ? 'var(--accent-indigo)' : 'var(--bg-glass)',
            color: isSpeaking ? 'white' : 'var(--accent-indigo)',
            border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '20px',
            fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
          }}
        >
          {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
          {isSpeaking ? 'Stop Audio' : 'Listen'}
        </motion.button>
      </div>

      {/* 3. Details Grid (Amount & Documents) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '20px', marginBottom: '20px' }}>
        {/* Benefit Amount Widget */}
        {isEligible && result.benefitAmount && (
          <div style={{ 
            padding: '28px', borderRadius: '16px', 
            background: 'var(--gradient-success)', 
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.25)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
              <Wallet size={120} color="white" />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.05em' }}>BENEFIT AMOUNT</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              {result.benefitAmount.startsWith('₹') ? result.benefitAmount : `₹${result.benefitAmount}`}
            </p>
            {result.paymentFrequency && (
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                {result.paymentFrequency}
              </p>
            )}
          </div>
        )}

        {/* Required Documents Checklist */}
        {isEligible && result.requiredDocuments && result.requiredDocuments.length > 0 && (
          <div className="glass-card" style={{ padding: '24px', gridColumn: (isEligible && result.benefitAmount) ? 'auto' : '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ClipboardList size={18} style={{ color: 'var(--accent-amber)' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Required Documents Checklist</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.requiredDocuments.map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: 'var(--bg-glass)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-glow)' }}>
                    <CheckCircle2 size={12} style={{ color: 'var(--accent-indigo)' }} />
                  </div>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{doc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Steps (Kya Karna Hoga) */}
        {isEligible && result.actionSteps && result.actionSteps.length > 0 && (
          <div className="glass-card" style={{ padding: '24px', gridColumn: '1 / -1', background: 'var(--bg-card)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={18} style={{ color: 'var(--accent-indigo)' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Next Steps (How to Apply)</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {result.actionSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-indigo)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>
                    {i + 1}
                  </div>
                  <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection Explanation (Kyu Nahi Mil Raha?) */}
        {!isEligible && result.rejectionExplanation && result.rejectionExplanation.criteria && (
           <div className="glass-card" style={{ padding: '24px', gridColumn: '1 / -1', borderLeft: '4px solid var(--accent-rose)', background: 'var(--bg-glass)' }}>
             <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <XCircle size={18} /> Why was this profile rejected?
             </h4>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Scheme Requirement</p>
                  <p style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{result.rejectionExplanation.criteria}</p>
                </div>
                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Your Profile</p>
                  <p style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>{result.rejectionExplanation.yourProfile}</p>
                </div>
             </div>
           </div>
        )}
      </div>

      {/* 4. Citation Block */}
      {result.citation && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Quote size={18} style={{ color: 'var(--text-muted)' }} />
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Official Document Source</h4>
          </div>
          <blockquote style={{
            padding: '16px 20px', borderRadius: '12px', borderLeft: '4px solid var(--text-muted)',
            background: 'var(--bg-secondary)', fontStyle: 'italic',
            fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7,
            marginBottom: '12px'
          }}>
            "{result.citation}"
          </blockquote>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            {result.citationSource && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} /> 
                {result.scheme} Document • Page {result.citationSource.page || 'N/A'}, Section: {result.citationSource.section || 'General'}
                {result.citationSource.subsection ? ` • ${result.citationSource.subsection}` : ''}
              </p>
            )}
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {result.documentUrl && (
                <a href={result.documentUrl} target="_blank" rel="noreferrer" 
                   style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '8px', transition: 'all 0.2s' }}
                   onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                   onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <FileText size={14} /> View Document
                </a>
              )}
              {result.officialWebsite && (
                <a href={result.officialWebsite.startsWith('http') ? result.officialWebsite : `https://${result.officialWebsite}`} target="_blank" rel="noreferrer" 
                   style={{ fontSize: '0.85rem', color: 'var(--accent-indigo)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-glass)', padding: '6px 12px', borderRadius: '8px', transition: 'all 0.2s', border: '1px solid var(--border-color)' }}
                   onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                   onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  <Globe size={14} /> Visit Official Portal
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Alternative Suggestions Prompt for Ineligible Farmers */}
      {!isEligible && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginTop: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid var(--accent-violet)', background: 'var(--bg-glass)', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '12px', background: 'var(--gradient-primary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Sparkles size={24} color="white" />
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Looking for alternatives?</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Although this profile did not meet the exact parameters for {result.scheme}, our AI Eligibility Engine constantly monitors hundreds of central and state-level agricultural schemes. Try modifying your profile parameters if you believe there was an error, or run a "Simultaneous Check" against all available schemes from the dropdown above to discover other feasible options that perfectly match your specific agricultural parameters.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 6. Footer Meta */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={12} /> Processed in {result.responseTime}s • analyzed {result.chunksAnalyzed} embedded chunks
        </p>
      </div>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────── */
export default function EligibilityCheck() {
  const location = useLocation();
  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState('');
  const [voiceProfile, setVoiceProfile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    getSchemes().then((s) => setSchemes(s.data || [])).catch(console.error);
  }, []);

  const handleCheck = async (profileData) => {
    if (!selectedScheme) {
      addToast('Missing Scheme', 'Please select a scheme from the dropdown first', 'warning');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      addToast('Profile Generation', 'Building farmer profile...', 'info');
      const profile = await createProfile(profileData);
      if (!profile.success) throw new Error(profile.error || 'Failed to create profile');

      addToast('AI Scanning', 'Analyzing documents via RAG...', 'info');
      const eligibility = await checkEligibility(profile.data._id, selectedScheme);
      if (eligibility.success) {
        setResult(eligibility.data);
        addToast('Check Complete', 'AI analysis finished successfully', 'success');
      } else {
        addToast('Analysis Failed', eligibility.error || 'Eligibility check failed', 'error');
      }
    } catch (e) {
      addToast('System Error', e.response?.data?.error || e.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          <Search size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-indigo)' }} />
          Eligibility <span className="gradient-text">Check</span>
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Voice or form input → AI-powered eligibility analysis with PDF citations
        </p>
      </motion.div>

      {/* Scheme Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ padding: '20px', marginBottom: '24px' }}
      >
        <label style={{ ...labelStyle, marginBottom: '10px' }}>
          <FileText size={14} /> Select Government Scheme
        </label>
        <select
          value={selectedScheme}
          onChange={(e) => setSelectedScheme(e.target.value)}
          className="select-dark"
          style={{ fontSize: '1rem', fontWeight: 500 }}
        >
          <option value="">— Choose a scheme —</option>
          <option value="all">🔍 Check all available schemes simultaneously</option>
          {schemes.map((s) => (
            <option key={s._id} value={s.name}>{s.name} ({s.totalChunks} chunks)</option>
          ))}
        </select>
      </motion.div>

      {/* Voice Input */}
      <VoiceInput onProfileExtracted={setVoiceProfile} />

      {/* Profile Form */}
      <ProfileForm initialData={voiceProfile || location.state?.profile} onSubmit={handleCheck} loading={loading} />

      {/* Result */}
      <AnimatePresence>
        {result && (Array.isArray(result) ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Comprehensive Scan Results</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>{result.length} Schemes Analyzed</p>
              </div>
            </div>
            {result.map((r, i) => (
              <div key={i} style={{ 
                background: 'var(--bg-glass)', 
                border: '1px solid var(--border-glass)', 
                borderRadius: '24px', 
                padding: '32px',
                position: 'relative',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
              }}>
                <div style={{ 
                  position: 'absolute', top: '-16px', left: '32px', 
                  background: 'var(--bg-primary)', padding: '4px 16px', 
                  borderRadius: '20px', border: '1px solid var(--border-glass)',
                  fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <Shield size={14} style={{ color: r.eligible ? 'var(--accent-emerald)' : 'var(--accent-rose)' }} />
                  SCHEME {i + 1} OF {result.length}
                </div>
                <ProofCard result={r} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: '32px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
             <ProofCard result={result} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
