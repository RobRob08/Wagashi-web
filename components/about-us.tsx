"use client";
import { motion } from "motion/react";

export function About() {
  return (
    <section id="about" className="py-24 lg:py-32 ">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left - Images */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-6">
              <div className="aspect-[3/4] bg-card overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1734244362736-db634950a7d4?w=500&q=80"
                  alt="Traditional craft"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] bg-card overflow-hidden mt-12">
                <img
                  src="https://images.unsplash.com/photo-1627546365203-caf3b1f02d7b?w=500&q=80"
                  alt="Wagashi detail"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute -top-6 -right-6 w-32 h-32 border border-primary/20"></div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="text-sm tracking-[0.3em] uppercase">
                Our Philosophy
              </div>
              <h2 className="text-4xl lg:text-5xl">職人の心</h2>
              <div className="w-16 h-px "></div>
            </div>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Wagashi aims to provide quality snack and desserts.
                Each confection is a meditation on nature, seasons, and the ephemeral beauty 
                that defines Japanese aesthetics.
              </p>
              <p>
                We use only the finest natural ingredients, selected at the peak of their season. 
                Our techniques, passed down through twelve generations, honor the principles of 
                <span className="text-foreground italic"> wa</span> (harmony), 
                <span className="text-foreground italic"> kei</span> (respect), 
                <span className="text-foreground italic"> sei</span> (purity), and 
                <span className="text-foreground italic"> jaku</span> (tranquility).
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
              <div>
                <div className="text-3xl mb-2">Quality</div>
                <div className="text-sm text-muted-foreground">Ingredients</div>
              </div>
              <div>
                <div className="text-3xl mb-2">2024</div>
                <div className="text-sm text-muted-foreground">Started in</div>
              </div>
              <div>
                <div className="text-3xl mb-2">100%</div>
                <div className="text-sm text-muted-foreground">Handcrafted</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
