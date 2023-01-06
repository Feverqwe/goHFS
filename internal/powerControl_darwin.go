//go:build darwin

package internal

import (
	"time"

	"github.com/caseymrm/go-caffeinate"
)

type PowerControl struct {
	count int
	ch    chan int
}

func (s *PowerControl) Inc() {
	if s.count == 0 {
		s.ch <- 1
	}
	s.count++
}

func (s *PowerControl) Dec() {
	s.count--
	if s.count == 0 {
		s.ch <- 0
	}
}

func GetPowerControl() *PowerControl {
	powerControl := &PowerControl{
		ch: make(chan int),
	}
	c := caffeinate.Caffeinate{
		IdleSystem: true,
		// System:     true,
	}
	go func() {
		isActive := false
		for {
			v := <-powerControl.ch
			switch v {
			case 1:
				isActive = true
				if !c.Running() {
					go func() {
						c.Start()
						for {
							time.Sleep(5 * time.Second)
							if !isActive {
								break
							}
						}
						c.Stop()
					}()
				}
			case 0:
				isActive = false
			}
		}
	}()
	return powerControl
}
