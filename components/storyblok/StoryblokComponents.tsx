'use client'

import { storyblokEditable } from '@storyblok/react/rsc'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from 'next/navigation'
import {
  Home,
  MessageCircle,
  Camera,
  User,
  Search,
  Music,
  Radio,
  Headphones,
  PlayCircle,
  Heart
} from 'lucide-react'

// Helper function to render rich text
const renderRichText = (content: any) => {
  if (!content) return null

  if (typeof content === 'string') {
    return <div dangerouslySetInnerHTML={{ __html: content }} />
  }

  // Handle Storyblok rich text format
  if (content.content) {
    return (
      <div className="prose prose-lg max-w-none [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6">
        {content.content.map((node: any, index: number) => {
          if (node.type === 'paragraph') {
            return (
              <p key={index} className="text-lg leading-relaxed text-foreground mb-4">
                {node.content?.map((textNode: any, textIndex: number) => {
                  if (textNode.type === 'text') {
                    return textNode.text
                  }
                  return null
                })}
              </p>
            )
          }
          return null
        })}
      </div>
    )
  }

  return <div dangerouslySetInnerHTML={{ __html: content }} />
}

// Hero Section Component
export const HeroSection = ({ blok }: { blok: any }) => (
  <div {...storyblokEditable(blok)}>
    {/* Hero Section */}
    <section className="py-12 md:py-16">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground uppercase tracking-tight">
          {blok.title}
        </h1>
        <p className="text-xl md:text-2xl text-foreground max-w-4xl mx-auto leading-relaxed">
          {blok.description}
        </p>
      </div>
    </section>

    {/* Large Hero Image */}
    <section className="py-12">
      <div
        className="aspect-[21/9] bg-gradient-to-r from-purple-900/80 to-blue-900/80 relative overflow-hidden"
        style={blok.hero_image?.filename ? {
          backgroundImage: `url(${blok.hero_image.filename})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight mb-4">
              {blok.hero_image_title}
            </h2>
            <p className="text-xl md:text-2xl max-w-2xl mx-auto">
              {blok.hero_image_subtitle}
            </p>
          </div>
        </div>
        {!blok.hero_image?.filename && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20"></div>
        )}
      </div>
    </section>
  </div>
)

// Mission Section Component
export const MissionSection = ({ blok }: { blok: any }) => (
  <section className="py-12" {...storyblokEditable(blok)}>
    <div className="bg-card border border-border p-8 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground uppercase tracking-tight">
          {blok.title}
        </h2>
      </div>
      <div className="space-y-4 text-lg leading-relaxed text-foreground">
        {renderRichText(blok.content)}
      </div>
    </div>
  </section>
)

// Host Section Component
export const HostSection = ({ blok }: { blok: any }) => (
  <section className="py-12" {...storyblokEditable(blok)}>
    <div className="bg-card border border-border p-8 space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground uppercase tracking-tight">
          {blok.title}
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Host Photo */}
        <div className="flex justify-center lg:justify-start">
          <div className="w-full max-w-md aspect-square bg-muted/20 border border-border overflow-hidden">
            {blok.host_photo?.filename ? (
              <Image
                src={blok.host_photo.filename}
                alt={blok.host_name}
                width={500}
                height={500}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-muted-foreground">{blok.host_name?.toUpperCase()}</div>
                  <div className="text-sm text-muted-foreground">HOST PHOTO</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Host Bio */}
        <div className="space-y-6 flex flex-col justify-center">
          <div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-3 tracking-tight">
              {blok.host_name}
            </h3>
            <div className="mb-6">
              <span className="text-lg text-foreground font-black tracking-tight">{blok.host_title}</span>
            </div>
          </div>

          <div className="space-y-6 text-lg leading-relaxed text-foreground">
            {renderRichText(blok.bio_paragraphs)}
          </div>
        </div>
      </div>
    </div>
  </section>
)

// Service Card Component
export const ServiceCard = ({ blok }: { blok: any }) => (
  <div className="bg-card border border-border p-6 space-y-4" {...storyblokEditable(blok)}>
    <div className="mb-4">
      <h3 className="text-base font-black uppercase tracking-tight text-foreground">
        {blok.title}
      </h3>
    </div>
    <p className="text-base leading-relaxed text-foreground">
      {blok.description}
    </p>
  </div>
)

// What We Do Section Component
export const WhatWeDoSection = ({ blok }: { blok: any }) => (
  <section className="py-12 space-y-6" {...storyblokEditable(blok)}>
    <div className="text-center mb-8">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground uppercase tracking-tight mb-4">
        {blok.title}
      </h2>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {blok.services?.map((service: any) => (
        <ServiceCard key={service._uid} blok={service} />
      ))}
    </div>
  </section>
)

// Philosophy Section Component
export const PhilosophySection = ({ blok }: { blok: any }) => (
  <section className="py-12" {...storyblokEditable(blok)}>
    <div className="bg-card border border-border p-8 space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground uppercase tracking-tight">
          {blok.title}
        </h2>
      </div>
      <div className="space-y-4 text-lg leading-relaxed text-foreground">
        {renderRichText(blok.content)}
      </div>
    </div>
  </section>
)

// Community Image Section Component
export const CommunityImageSection = ({ blok }: { blok: any }) => (
  <section className="py-12" {...storyblokEditable(blok)}>
    <div
      className="aspect-[21/9] bg-gradient-to-r from-orange-900/80 to-red-900/80 relative overflow-hidden"
      style={blok.background_image?.filename ? {
        backgroundImage: `url(${blok.background_image.filename})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight mb-4">
            {blok.title}
          </h2>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto font-medium">
            {blok.subtitle}
          </p>
        </div>
      </div>
      {!blok.background_image?.filename && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-red-600/20"></div>
      )}
    </div>
  </section>
)

// Community Card Component
export const CommunityCard = ({ blok }: { blok: any }) => (
  <div className="bg-card border border-border p-6 space-y-4" {...storyblokEditable(blok)}>
    <div className="mb-4">
      <h3 className="text-base font-black uppercase tracking-tight text-foreground">
        {blok.title}
      </h3>
    </div>
    <p className="text-base leading-relaxed text-foreground mb-4">
      {blok.description}
    </p>
    {blok.button_text && blok.button_link && (
      <Link href={blok.button_link.cached_url || blok.button_link.url || '#'}>
        <Button className="w-full bg-[#b12e2e] hover:bg-[#8e2424] text-white">
          {blok.button_text}
        </Button>
      </Link>
    )}
  </div>
)

// Community Section Component
export const CommunitySection = ({ blok }: { blok: any }) => (
  <section className="py-12 space-y-6" {...storyblokEditable(blok)}>
    <div className="text-center mb-8">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground uppercase tracking-tight mb-4">
        {blok.title}
      </h2>
      <p className="text-lg text-foreground max-w-2xl mx-auto">
        {blok.description}
      </p>
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      {blok.community_cards?.map((card: any) => (
        <CommunityCard key={card._uid} blok={card} />
      ))}
    </div>
  </section>
)

// Partner Stations Section Component
export const PartnerStationsSection = ({ blok }: { blok: any }) => (
  <section className="py-12" {...storyblokEditable(blok)}>
    <div className="bg-card border border-border p-8 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground uppercase tracking-tight mb-4">
          {blok.title}
        </h2>
        <p className="text-base text-foreground max-w-2xl mx-auto">
          {blok.description}
        </p>
      </div>

      {/* Station Logos Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
        {blok.station_logos && Array.isArray(blok.station_logos) ?
          blok.station_logos.map((logo: any, index: number) => (
            <div key={index} className="aspect-square bg-muted/20 border border-border flex items-center justify-center p-4">
              <Image
                src={logo.filename}
                alt={logo.alt || `Partner Station ${index + 1}`}
                width={100}
                height={100}
                className="w-full h-full object-contain"
              />
            </div>
          )) :
          // Placeholder logos if no logos uploaded yet
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-square bg-muted/20 border border-border flex items-center justify-center p-4">
              <div className="text-center">
                <div className="text-sm font-bold text-muted-foreground">STATION</div>
                <div className="text-xs text-muted-foreground">LOGO</div>
              </div>
            </div>
          ))
        }
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-foreground/70">
          Want to air Rhythm Lab Radio on your station?
          <a
            href={`mailto:${blok.contact_email}`}
            className="text-foreground hover:text-foreground/70 transition-colors font-medium ml-1"
          >
            Get in touch
          </a>
        </p>
      </div>
    </div>
  </section>
)

// Contact Item Component
export const ContactItem = ({ blok }: { blok: any }) => (
  <div className="text-center space-y-3" {...storyblokEditable(blok)}>
    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
      {blok.title}
    </h3>
    <p className="text-sm text-foreground">
      {blok.description}
    </p>
    <a
      href={`mailto:${blok.email}`}
      className="text-foreground hover:text-foreground/70 transition-colors text-sm font-medium block"
    >
      {blok.email}
    </a>
  </div>
)

// Contact Section Component
export const ContactSection = ({ blok }: { blok: any }) => (
  <section className="py-12" {...storyblokEditable(blok)}>
    <div className="bg-card border border-border p-8 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground uppercase tracking-tight mb-4">
          {blok.title}
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {blok.contact_items?.map((item: any) => (
          <ContactItem key={item._uid} blok={item} />
        ))}
      </div>
    </div>
  </section>
)

// CTA Button Component
export const CTAButton = ({ blok }: { blok: any }) => {
  const isPrimary = blok.style === 'primary'

  return (
    <Link href={blok.link?.cached_url || blok.link?.url || '#'} {...storyblokEditable(blok)}>
      <Button
        size="lg"
        className={isPrimary
          ? "bg-[#b12e2e] hover:bg-[#8e2424] text-white"
          : "border-2 border-foreground/20 text-foreground hover:bg-foreground hover:text-background"
        }
        variant={isPrimary ? "default" : "outline"}
      >
        {blok.text}
      </Button>
    </Link>
  )
}

// Footer CTA Section Component
export const FooterCTASection = ({ blok }: { blok: any }) => (
  <section className="py-12 pb-24" {...storyblokEditable(blok)}>
    <div className="bg-card border border-border p-8 text-center space-y-6">
      <h2 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight">
        {blok.title}
      </h2>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {blok.buttons?.map((button: any) => (
          <CTAButton key={button._uid} blok={button} />
        ))}
      </div>
    </div>
  </section>
)

// Helper function to get icon component
const getIconComponent = (iconData: any) => {
  // If iconData is a string, use the old logic
  if (typeof iconData === 'string') {
    const iconMap: { [key: string]: any } = {
      home: Home,
      chat: MessageCircle,
      message: MessageCircle,
      camera: Camera,
      profile: User,
      user: User,
      search: Search,
      music: Music,
      radio: Radio,
      headphones: Headphones,
      play: PlayCircle,
      heart: Heart,
    }
    return iconMap[iconData.toLowerCase()] || Home
  }

  // If iconData is a Storyblok asset object, extract the filename and map to icons
  if (iconData && iconData.filename) {
    const filename = iconData.filename.toLowerCase()

    if (filename.includes('home')) return Home
    if (filename.includes('show') || filename.includes('music') || filename.includes('radio')) return Music
    if (filename.includes('profile') || filename.includes('user') || filename.includes('artist')) return User
    if (filename.includes('deep') || filename.includes('dive')) return Search
    if (filename.includes('blog') || filename.includes('message') || filename.includes('chat')) return MessageCircle
    if (filename.includes('heart') || filename.includes('favorite')) return Heart
    if (filename.includes('play')) return PlayCircle
  }

  // Default fallback
  return Home
}

// Menu Item Component (for mobile navigation)
export const MenuItem = ({ blok }: { blok: any }) => {
  const pathname = usePathname()
  const isActive = pathname === blok.menu_link?.cached_url || pathname === blok.menu_link?.url
  const IconComponent = getIconComponent(blok.menu_icon || 'home')

  return (
    <Link
      href={blok.menu_link?.cached_url || blok.menu_link?.url || '#'}
      className={`flex flex-col items-center justify-center py-3 px-1 min-w-0 flex-1 transition-all duration-200 active:scale-95 ${
        isActive
          ? 'text-[#b12e2e]'
          : 'text-muted-foreground hover:text-foreground active:text-foreground'
      }`}
      {...storyblokEditable(blok)}
    >
      <IconComponent className={`w-6 h-6 mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
      <span className={`text-xs font-medium text-center leading-tight ${isActive ? 'font-semibold' : ''}`}>
        {blok.menu_label}
      </span>
    </Link>
  )
}

// Mobile Navigation Component
export const MobileNavigation = ({ blok }: { blok: any }) => {
  console.log('MobileNavigation component rendering with blok:', blok)
  console.log('Menu items found:', blok.menu_items?.length || 0)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 lg:hidden z-30 shadow-lg"
      {...storyblokEditable(blok)}
    >
      <div className="flex items-center justify-center gap-4 px-2 py-3">
        {blok.menu_items?.map((item: any) => (
          <MenuItem key={item._uid} blok={item} />
        ))}
      </div>
    </nav>
  )
}

// Component mapping for Storyblok
export const storyblokComponents = {
  hero_section: HeroSection,
  mission_section: MissionSection,
  host_section: HostSection,
  what_we_do_section: WhatWeDoSection,
  philosophy_section: PhilosophySection,
  community_image_section: CommunityImageSection,
  community_section: CommunitySection,
  partner_stations_section: PartnerStationsSection,
  contact_section: ContactSection,
  footer_cta_section: FooterCTASection,
  service_card: ServiceCard,
  community_card: CommunityCard,
  contact_item: ContactItem,
  cta_button: CTAButton,
  mobile_navigation: MobileNavigation,
  menu_item: MenuItem
}