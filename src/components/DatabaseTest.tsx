import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const DatabaseTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDatabaseConnection = async () => {
    setLoading(true);
    setTestResult('');
    
    try {
      console.log('Testing database connection...');
      
      // Test 1: Check if we can connect
      const { data: user } = await supabase.auth.getUser();
      console.log('Current user:', user.user?.email);
      
      if (!user.user) {
        setTestResult('❌ No authenticated user found');
        return;
      }

      // Test 2: Check if vital_readings table exists
      const { data: vitals, error: vitalsError } = await supabase
        .from('vital_readings')
        .select('count')
        .limit(1);
      
      console.log('Vitals test:', { vitals, vitalsError });
      
      // Test 3: Check if medications table exists  
      const { data: meds, error: medsError } = await supabase
        .from('medications')
        .select('count')
        .limit(1);
        
      console.log('Medications test:', { meds, medsError });

      let result = '✅ Database Connection Test Results:\n\n';
      result += `User: ${user.user.email}\n`;
      result += `User ID: ${user.user.id}\n\n`;
      
      if (vitalsError) {
        result += `❌ Vital Readings Table: ${vitalsError.message}\n`;
      } else {
        result += `✅ Vital Readings Table: OK\n`;
      }
      
      if (medsError) {
        result += `❌ Medications Table: ${medsError.message}\n`;
      } else {
        result += `✅ Medications Table: OK\n`;
      }
      
      result += '\n💡 If any tables show errors, run the debug-database.sql script in Supabase SQL Editor';
      
      setTestResult(result);
      
    } catch (error) {
      console.error('Database test error:', error);
      setTestResult(`❌ Database test failed: ${(error as any).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">Database Connection Test</h3>
      
      <button
        onClick={testDatabaseConnection}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? 'Testing...' : 'Test Database Connection'}
      </button>
      
      {testResult && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
        </div>
      )}
    </div>
  );
};

export default DatabaseTest;
