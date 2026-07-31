"use client"

import React from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-white">
            Something went wrong
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-zinc-400">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <Button
            variant="outline"
            size="lg"
            className="mt-6"
            onClick={this.handleReset}
          >
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
