'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { validateEmail, validatePassword } from '@/lib/utils'
import { Eye, EyeOff, Loader2, Building2, UserPlus, Shield } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Corporate email address required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid corporate email address'
    }

    if (!formData.password) {
      newErrors.password = 'Security credentials required'
    } else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) {
        newErrors.password = 'Password must meet corporate security standards'
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your security credentials'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Security credentials do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
        }
      })

      if (error) {
        setErrors({ general: 'Registration failed. Please contact your system administrator.' })
        return
      }

      if (data.user) {
        // Check if email confirmation is required
        if (!data.session) {
          setErrors({ 
            general: 'Account created successfully. Please check your email for verification instructions.' 
          })
        } else {
          // Successful signup with immediate login
          router.push(redirectTo)
          router.refresh()
        }
      }
    } catch (error) {
      setErrors({ 
        general: 'System error encountered. Please contact your administrator.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) {
        setErrors({ general: 'External authentication service unavailable. Please try again.' })
      }
    } catch (error) {
      setErrors({ 
        general: 'System error encountered. Please contact your administrator.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] via-[#F8F9FA] to-[#E9ECEF] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Corporate Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-[#4A9D7C] rounded-lg flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#1A535C] font-mono tracking-tight">
            TRACKCRASTINATE
          </h1>
          <div className="mt-2 h-1 w-24 bg-[#4A9D7C] mx-auto rounded-full"></div>
          <p className="mt-4 text-sm text-[#607D8B] font-mono uppercase tracking-wider">
            EMPLOYEE ONBOARDING PORTAL
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white shadow-xl rounded-lg border border-[#E9ECEF] overflow-hidden">
          {/* Registration Banner */}
          <div className="bg-[#4A9D7C] px-6 py-3">
            <div className="flex items-center justify-center space-x-2">
              <UserPlus className="h-4 w-4 text-white" />
              <span className="text-white font-mono text-xs uppercase tracking-wider">
                NEW EMPLOYEE REGISTRATION
              </span>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-[#1A535C] font-mono">
                ACCESS REQUEST FORM
              </h2>
              <p className="mt-2 text-sm text-[#607D8B]">
                Complete the form below to request access to the productivity monitoring system
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {errors.general && (
                <div className={`${errors.general.includes('successfully') ? 'bg-[#F0F9FF] border-[#BAE6FD]' : 'bg-[#FEF2F2] border-[#FECACA]'} border rounded-md p-4`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`h-2 w-2 ${errors.general.includes('successfully') ? 'bg-[#4A9D7C]' : 'bg-[#E63946]'} rounded-full`}></div>
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm ${errors.general.includes('successfully') ? 'text-[#4A9D7C]' : 'text-[#E63946]'} font-mono`}>
                        {errors.general}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#607D8B] font-mono uppercase tracking-wider mb-2">
                    Corporate Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input font-mono"
                    placeholder="firstname.lastname@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-[#E63946] font-mono">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#607D8B] font-mono uppercase tracking-wider mb-2">
                    Security Code
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="input font-mono pr-10"
                      placeholder="Create secure password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-[#4A9D7C] transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-[#607D8B]" />
                      ) : (
                        <Eye className="h-4 w-4 text-[#607D8B]" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-[#E63946] font-mono">{errors.password}</p>
                  )}
                  <div className="mt-2 p-3 bg-[#F8F9FA] rounded-md border border-[#E9ECEF]">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-3 w-3 text-[#607D8B]" />
                      <span className="text-xs text-[#607D8B] font-mono uppercase tracking-wider">
                        Security Requirements
                      </span>
                    </div>
                    <ul className="text-xs text-[#607D8B] space-y-1 font-mono">
                      <li>• Minimum 8 characters</li>
                      <li>• At least one uppercase letter</li>
                      <li>• At least one lowercase letter</li>
                      <li>• At least one number</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#607D8B] font-mono uppercase tracking-wider mb-2">
                    Confirm Security Code
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      className="input font-mono pr-10"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-[#4A9D7C] transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-[#607D8B]" />
                      ) : (
                        <Eye className="h-4 w-4 text-[#607D8B]" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-[#E63946] font-mono">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#4A9D7C] hover:bg-[#1A535C] text-white font-mono text-sm uppercase tracking-wider py-3 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PROCESSING REQUEST...
                    </>
                  ) : (
                    'SUBMIT ACCESS REQUEST'
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E9ECEF]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-[#607D8B] font-mono uppercase tracking-wider">
                      ALTERNATIVE REGISTRATION
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                  className="w-full bg-[#F8F9FA] hover:bg-[#E9ECEF] text-[#607D8B] border border-[#E9ECEF] font-mono text-sm uppercase tracking-wider py-3 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      CONNECTING...
                    </>
                  ) : (
                    'GOOGLE AUTHENTICATION'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-[#607D8B] font-mono">
                EXISTING EMPLOYEE?{' '}
                <Link 
                  href={`/auth/login${redirectTo !== '/dashboard' ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`} 
                  className="text-[#4A9D7C] hover:text-[#1A535C] font-medium transition-colors"
                >
                  ACCESS SYSTEM
                </Link>
              </p>
            </div>

            {/* Terms and Conditions */}
            <div className="mt-6 p-4 bg-[#F8F9FA] rounded-md border border-[#E9ECEF]">
              <p className="text-xs text-[#607D8B] font-mono leading-relaxed">
                By submitting this request, you acknowledge that you have read and agree to the{' '}
                <a href="#" className="text-[#4A9D7C] hover:text-[#1A535C] transition-colors">
                  Employee Monitoring Policy
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#4A9D7C] hover:text-[#1A535C] transition-colors">
                  Data Usage Agreement
                </a>.
                All productivity data will be collected and analyzed in accordance with corporate guidelines.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#F8F9FA] px-6 py-3 border-t border-[#E9ECEF]">
            <p className="text-xs text-[#9E9E9E] text-center font-mono">
              EMPLOYEE ONBOARDING SYSTEM v2.1.4 | SECURE REGISTRATION PORTAL
            </p>
          </div>
        </div>

        {/* Corporate Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#9E9E9E] font-mono leading-relaxed">
            Registration requests are subject to approval by the Human Resources department.<br />
            Processing time: 24-48 hours during business days.
          </p>
        </div>
      </div>
    </div>
  )
}
