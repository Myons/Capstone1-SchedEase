package com.schedease.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

public class FirebaseAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(FirebaseAuthenticationFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        String requestURI = request.getRequestURI();
        
        logger.info("🔍 Firebase Auth Filter - Request: " + requestURI);
        logger.info("🔍 Firebase Auth Filter - Auth header present: " + (authHeader != null));
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String idToken = authHeader.substring(7);
            logger.info("🔍 Firebase Auth Filter - Token length: " + idToken.length());
            
            try {
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                logger.info("✅ Firebase Auth Filter - Token verified successfully for UID: " + decodedToken.getUid());
                
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    decodedToken,
                    null,
                    Collections.singleton(new SimpleGrantedAuthority("ROLE_USER"))
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.info("✅ Firebase Auth Filter - Authentication set in SecurityContext");
                
                // Add additional debugging
                logger.info("🔍 Firebase Auth Filter - SecurityContext authentication: " + 
                    (SecurityContextHolder.getContext().getAuthentication() != null ? "Present" : "Null"));
                if (SecurityContextHolder.getContext().getAuthentication() != null) {
                    logger.info("🔍 Firebase Auth Filter - Principal: " + 
                        SecurityContextHolder.getContext().getAuthentication().getPrincipal());
                    logger.info("🔍 Firebase Auth Filter - Authorities: " + 
                        SecurityContextHolder.getContext().getAuthentication().getAuthorities());
                }
            } catch (Exception e) {
                logger.error("❌ Firebase Auth Filter - Failed to verify Firebase ID token", e);
                SecurityContextHolder.clearContext();
            }
        } else {
            logger.warn("⚠️ Firebase Auth Filter - No valid Authorization header found");
        }
        
        filterChain.doFilter(request, response);
        
        // Log after the request is processed
        logger.info("🔍 Firebase Auth Filter - After filter chain - Authentication: " + 
            (SecurityContextHolder.getContext().getAuthentication() != null ? "Still present" : "Cleared"));
    }
} 