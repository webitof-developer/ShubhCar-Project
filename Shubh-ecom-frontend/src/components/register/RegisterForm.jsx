"use client";

import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, Building2, Eye, EyeOff, Loader2, UserCircle } from 'lucide-react';

const fieldClassName =
  'peer h-12 rounded-[10px] border border-[#94a3b866] bg-white px-[0.95rem] pt-[0.95rem] text-foreground shadow-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0';
const fieldLabelClassName =
  'pointer-events-none absolute left-4 top-0 -translate-y-1/2 text-xs text-primary bg-white px-2 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary';

export const RegisterForm = ({
  formData,
  errors,
  loading,
  showPassword,
  onChange,
  onSubmit,
  onTogglePassword,
  onCustomerTypeChange,
  onAgreeTermsChange,
}) => {
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={onChange}
            placeholder=" "
            className={`${fieldClassName} ${errors.firstName ? 'border-destructive' : ''}`}
          />
          <Label htmlFor="firstName" className={fieldLabelClassName}>
            First Name
          </Label>
          {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
        </div>
        <div className="relative">
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={onChange}
            placeholder=" "
            className={`${fieldClassName} ${errors.lastName ? 'border-destructive' : ''}`}
          />
          <Label htmlFor="lastName" className={fieldLabelClassName}>
            Last Name
          </Label>
          {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div className="relative">
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={onChange}
          placeholder=" "
          className={`${fieldClassName} ${errors.email ? 'border-destructive' : ''}`}
        />
        <Label htmlFor="email" className={fieldLabelClassName}>
          Email
        </Label>
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
      </div>

      <div className="relative">
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={onChange}
          placeholder=" "
          className={`${fieldClassName} ${errors.phone ? 'border-destructive' : ''}`}
        />
        <Label htmlFor="phone" className={fieldLabelClassName}>
          Phone
        </Label>
        {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
      </div>

      <div className="relative">
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={onChange}
          placeholder=" "
          className={`${fieldClassName} pr-10 ${errors.password ? 'border-destructive' : ''}`}
        />
        <Label htmlFor="password" className={fieldLabelClassName}>
          Password
        </Label>
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
      </div>

      <div className="space-y-3">
        <Label>
          Account Type <span className="text-destructive">*</span>
        </Label>
        <RadioGroup value={formData.customerType} onValueChange={onCustomerTypeChange} className="grid grid-cols-2 gap-3">
          <label
            htmlFor="retail"
            className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
              formData.customerType === 'retail'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="retail" id="retail" className="sr-only" />
            <UserCircle className={`w-5 h-5 ${formData.customerType === 'retail' ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-medium text-sm">Personal</p>
              <p className="text-xs text-muted-foreground">Individual buyer</p>
            </div>
          </label>
          <label
            htmlFor="wholesale"
            className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
              formData.customerType === 'wholesale'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <RadioGroupItem value="wholesale" id="wholesale" className="sr-only" />
            <Building2 className={`w-5 h-5 ${formData.customerType === 'wholesale' ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-medium text-sm">Wholesale</p>
              <p className="text-xs text-muted-foreground">Business buyer</p>
            </div>
          </label>
        </RadioGroup>

        {formData.customerType === 'wholesale' && (
          <Alert className="bg-warning/10 border-warning/30">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              Wholesale accounts require admin approval. You&apos;ll have access to retail
              pricing until your account is verified.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="agreeToTerms"
          checked={formData.agreeToTerms}
          onCheckedChange={onAgreeTermsChange}
          required
        />
        <label htmlFor="terms" className="text-sm text-muted-foreground leading-none cursor-pointer">
          I agree to the{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Terms & Conditions
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </label>
      </div>

      <Button type="submit" className="w-full h-11 rounded-full tracking-widest text-base" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating account...
          </>
        ) : (
          'REGISTER NOW'
        )}
      </Button>
    </form>
  );
};
